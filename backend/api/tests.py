from django.test import TestCase, Client
from django.contrib.auth.models import User
from unittest.mock import patch
from api.models import SavedPortfolio
import json

class CloudStorageTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user_a_email = "alice@example.com"
        self.user_b_email = "bob@example.com"

    @patch('api.auth.id_token.verify_oauth2_token')
    def test_user_creation_and_persistence(self, mock_verify):
        """
        Verify that:
        1. A user is created automatically upon first valid authentication.
        2. Portfolios can be saved (POST).
        3. Portfolios can be retrieved (GET).
        4. Data persistence is accurate.
        """
        # --- 1. Simulate First Login for Alice ---
        mock_verify.return_value = {
            'email': self.user_a_email,
            'given_name': 'Alice',
            'family_name': 'Test',
        }

        # Payload
        portfolio_data = {
            "name": "Alice's Tech Stocks",
            "description": "High growth",
            "positions": [
                {"ticker": "AAPL", "quantity": 10, "asset_class": "Equity"},
                {"ticker": "GOOGL", "quantity": 5, "asset_class": "Equity"}
            ]
        }

        # Send Request (Authentication happens here)
        response = self.client.post(
            '/api/portfolios',
            data=portfolio_data,
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer valid_token_alice'
        )

        # Assert User Creation
        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.filter(username=self.user_a_email).exists())
        user_a = User.objects.get(username=self.user_a_email)
        
        # Assert Response (Summary only)
        res_json = response.json()
        self.assertEqual(res_json['name'], "Alice's Tech Stocks")
        # positions not in summary
        portfolio_id = res_json['id']

        # --- 2. Retrieve Portfolio Details (Persistence) ---
        response_detail = self.client.get(
            f'/api/portfolios/{portfolio_id}',
            HTTP_AUTHORIZATION='Bearer valid_token_alice'
        )
        self.assertEqual(response_detail.status_code, 200)
        detail_json = response_detail.json()
        self.assertEqual(len(detail_json['positions']), 2)
        self.assertEqual(detail_json['positions'][0]['ticker'], 'AAPL')

        # --- 3. Retrieve Portfolio List ---
        response_get = self.client.get(
            '/api/portfolios',
            HTTP_AUTHORIZATION='Bearer valid_token_alice'
        )
        self.assertEqual(response_get.status_code, 200)
        portfolios = response_get.json()
        self.assertEqual(len(portfolios), 1)
        self.assertEqual(portfolios[0]['id'], portfolio_id)


    @patch('api.auth.id_token.verify_oauth2_token')
    def test_data_isolation(self, mock_verify):
        """
        Verify that User A cannot access User B's portfolios.
        """
        # --- 1. Setup User A and their portfolio ---
        # We manually create users here to save mocking complexity for setup
        user_a = User.objects.create(username=self.user_a_email, email=self.user_a_email)
        user_b = User.objects.create(username=self.user_b_email, email=self.user_b_email)

        p_a = SavedPortfolio.objects.create(
            user=user_a,
            name="Alice's Secret",
            positions=[],
        )

        # --- 2. User B tries to access User A's portfolio ---
        # Mock Auth as User B
        mock_verify.return_value = {
            'email': self.user_b_email, 
            'given_name': 'Bob', 
            'family_name': 'Test'
        }

        # Attempt GET by ID
        response = self.client.get(
            f'/api/portfolios/{p_a.id}',
            HTTP_AUTHORIZATION='Bearer valid_token_bob'
        )
        self.assertEqual(response.status_code, 404) # API returns 404 for Not Found (safe)

        # Attempt LIST
        response_list = self.client.get(
            '/api/portfolios',
            HTTP_AUTHORIZATION='Bearer valid_token_bob'
        )
        self.assertEqual(response_list.status_code, 200)
        self.assertEqual(len(response_list.json()), 0) # Should verify B sees nothing

    @patch('api.auth.id_token.verify_oauth2_token')
    def test_delete_portfolio(self, mock_verify):
        user_a = User.objects.create(username=self.user_a_email, email=self.user_a_email)
        p_a = SavedPortfolio.objects.create(user=user_a, name="To Delete", positions=[])

        mock_verify.return_value = {'email': self.user_a_email}

        response = self.client.delete(
            f'/api/portfolios/{p_a.id}',
            HTTP_AUTHORIZATION='Bearer valid_token_alice'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(SavedPortfolio.objects.count(), 0)

    @patch('api.auth.id_token.verify_oauth2_token')
    def test_update_portfolio(self, mock_verify):
        """
        Verify that a user can update their existing portfolio (PUT).
        """
        # 1. Create Portfolio via Model
        user_a = User.objects.create(username=self.user_a_email, email=self.user_a_email)
        p = SavedPortfolio.objects.create(
            user=user_a, 
            name="Original Name", 
            positions=[{"ticker": "A", "quantity": 1}]
        )
        
        mock_verify.return_value = {'email': self.user_a_email}

        # 2. Update Payload
        update_data = {
            "name": "Updated Name",
            "positions": [{"ticker": "B", "quantity": 2}],
            "description": "New Desc"
        }

        # 3. Send PUT
        response = self.client.put(
            f'/api/portfolios/{p.id}',
            data=update_data,
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer valid_token_alice'
        )

        self.assertEqual(response.status_code, 200)
        
        # 4. Verify DB Update
        p.refresh_from_db()
        self.assertEqual(p.name, "Updated Name")
        self.assertEqual(len(p.positions), 1)
        self.assertEqual(p.positions[0]['ticker'], 'B')

