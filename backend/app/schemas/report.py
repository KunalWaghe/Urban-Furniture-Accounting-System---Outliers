"""Schemas for financial report responses."""

from datetime import date
from typing import List

from pydantic import BaseModel


class BalanceSheetLine(BaseModel):
    account_id: int
    code: str
    name: str
    balance: float


class BalanceSheetResponse(BaseModel):
    as_of_date: date
    assets: List[BalanceSheetLine]
    liabilities: List[BalanceSheetLine]
    capital: List[BalanceSheetLine]
    net_income: float
    total_assets: float
    total_liabilities: float
    total_capital: float
    total_liabilities_and_capital: float
    balanced: bool
