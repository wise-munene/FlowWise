from app import db
from datetime import datetime, date
import enum


class BudgetPeriod(enum.Enum):
    monthly = 'monthly'
    yearly  = 'yearly'


class Budget(db.Model):
    __tablename__ = 'budgets'

    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category       = db.Column(db.String(50), nullable=False)
    budget_amount  = db.Column(db.Numeric(10, 2), nullable=False)
    spent_amount   = db.Column(db.Numeric(10, 2), default=0)
    period         = db.Column(db.Enum(BudgetPeriod), nullable=False, default=BudgetPeriod.monthly)
    alert_threshold = db.Column(db.Numeric(5, 2), default=0.80)
    # FIX BUG-08: track when the current period started so spent_amount can be reset
    period_start   = db.Column(db.Date, nullable=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def current_period_start(self):
        today = date.today()
        if self.period == BudgetPeriod.monthly:
            return today.replace(day=1)
        else:  # yearly
            return today.replace(month=1, day=1)

    def reset_if_new_period(self):
        """If we've rolled into a new period, zero out spent_amount."""
        new_start = self.current_period_start()
        if self.period_start is None or self.period_start < new_start:
            self.spent_amount = 0
            self.period_start = new_start
            return True
        return False

    def is_exceeded(self):
        return float(self.spent_amount) >= float(self.budget_amount)

    def is_near_limit(self):
        if float(self.budget_amount) == 0:
            return False
        return (float(self.spent_amount) / float(self.budget_amount)) >= float(self.alert_threshold)

    def percentage_used(self):
        if float(self.budget_amount) == 0:
            return 0
        return round((float(self.spent_amount) / float(self.budget_amount)) * 100, 2)

    def __repr__(self):
        return f'<Budget {self.category} {self.period}>'
