"""
Pydantic schemas for Financial Reporting (Profit & Loss and Balance Sheet) (Phase 5, P0-BE-08).
"""

from typing import List, Optional
from pydantic import BaseModel, Field


# Individual line item in a financial accounting report
class ReportLine(BaseModel):
    """
    Detailed ledger account line item reflecting its computed net balance.
    """
    account_id: Optional[int] = Field(None, description="Internal primary key ID of the account")
    account_code: str = Field(..., description="Chart of accounts code e.g. '1010', '4010'")
    account_name: str = Field(..., description="Human-readable ledger account title")
    balance: float = Field(..., description="Net balance in standard currency units (INR)")


# Grouped category section of report lines with an aggregate total
class ReportSection(BaseModel):
    """
    Category block aggregating a list of report lines and providing their sum total.
    """
    lines: List[ReportLine] = Field(default_factory=list, description="Account line items within this category")
    total: float = Field(0.0, description="Sum total of account balances in this section")


# Profit and Loss (Income Statement) response schema
class ProfitLossReport(BaseModel):
    """
    Profit & Loss statement comparing total operating income against expenses to derive net income.
    """
    year: Optional[int] = Field(None, description="Reporting fiscal calendar year filter")
    income: ReportSection = Field(..., description="Revenues and sales income section")
    expenses: ReportSection = Field(..., description="Direct costs and operational expenses section")
    net_income: float = Field(..., description="Calculated net income (income.total - expenses.total)")


# Balance Sheet financial statement response schema
class BalanceSheetReport(BaseModel):
    """
    Balance Sheet snapshot asserting the fundamental equation: Assets = Liabilities + Capital.
    """
    year: Optional[int] = Field(None, description="Reporting fiscal calendar year filter")
    assets: ReportSection = Field(..., description="Current and fixed asset accounts section")
    liabilities: ReportSection = Field(..., description="Short-term and long-term liabilities section")
    capital: ReportSection = Field(..., description="Owner capital and retained earnings section")
    is_balanced: bool = Field(..., description="Audit flag indicating whether Assets == Liabilities + Capital")
    total_liabilities_and_capital: float = Field(..., description="Combined sum of Liabilities and Capital")
