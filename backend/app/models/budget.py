from app import db
from datetime import datetime
import enum

class BudgetPeriod(enum.Enum):  # Enum to represent the period of the budget, either monthly or yearly.
    monthly = 'monthly'
    yearly = 'yearly'

class Budget(db.Model):
    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    budget_amount = db.Column(db.Numeric(10, 2), nullable=False)
    spent_amount = db.Column(db.Numeric(10, 2), default=0)
    period = db.Column(db.Enum(BudgetPeriod), nullable=False, default=BudgetPeriod.monthly)
    alert_threshold = db.Column(db.Numeric(5, 2), default=0.80)  # when they use 80% of their budget, they will get an alert
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def is_exceeded(self):  # Check if the spent amount has exceeded the budget amount.
        return self.spent_amount >= self.budget_amount

    def is_near_limit(self):  # Check if the spent amount is near the budget limit based on the alert threshold.
        if self.budget_amount == 0:
            return False
        return (self.spent_amount / self.budget_amount) >= self.alert_threshold

    def percentage_used(self):   # Calculate the percentage of the budget that has been used. If the budget amount is zero, return 0 to avoid division by zero.
        if self.budget_amount == 0:
            return 0
        return round((self.spent_amount / self.budget_amount) * 100, 2)

    def __repr__(self):   # Representation of the Budget object for debugging purposes, showing the category and period of the budget.
        return f'<Budget {self.category} {self.period}>'


