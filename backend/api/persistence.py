from django.db import models
from django.contrib.auth.models import User

class SavedPortfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolios')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    description = models.TextField(blank=True, null=True)
    
    # Store positions as JSON:
    # [{"ticker": "AAPL", "quantity": 10, "asset_class": "Equity", ...}]
    positions = models.JSONField(default=list)

    def __str__(self):
        return f"{self.user.username} - {self.name}"
