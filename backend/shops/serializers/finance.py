from django.db.models import Sum
from rest_framework import serializers

from ..models.operations import Expense, WorkOrder


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )

    class Meta:
        model = Expense
        fields = [
            "id",
            "shop",
            "title",
            "amount",
            "category",
            "category_display",
            "recorded_at",
        ]


class FinanceSummarySerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    expense_breakdown = serializers.DictField()

    def get_summary(self, tenant):
        revenue = (
            WorkOrder.objects.filter(tenant=tenant, status="completed").aggregate(
                total=Sum("estimate_price")
            )["total"]
            or 0
        )

        expenses = (
            Expense.objects.filter(tenant=tenant).aggregate(total=Sum("amount"))[
                "total"
            ]
            or 0
        )

        categories = (
            Expense.objects.filter(tenant=tenant)
            .values("category")
            .annotate(total=Sum("amount"))
        )

        breakdown = {item["category"]: float(item["total"]) for item in categories}

        return {
            "total_revenue": float(revenue),
            "total_expenses": float(expenses),
            "net_profit": float(revenue - expenses),
            "expense_breakdown": breakdown,
        }
