from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database.connection import get_db
from app.models.models import Product, Customer, Order, OrderItem
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

LOW_STOCK_THRESHOLD = 5


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()
    low_stock_count = db.query(func.count(Product.id)).filter(Product.quantity <= LOW_STOCK_THRESHOLD).scalar()
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_count=low_stock_count,
        total_revenue=total_revenue
    )


@router.get("/orders-last-7-days")
def orders_last_7_days(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    result = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = db.query(func.count(Order.id)).filter(
            func.date(Order.created_at) == day
        ).scalar()
        result.append({"date": str(day), "count": count})
    return result


@router.get("/stock-health")
def stock_health(db: Session = Depends(get_db)):
    healthy = db.query(func.count(Product.id)).filter(Product.quantity > LOW_STOCK_THRESHOLD).scalar()
    low = db.query(func.count(Product.id)).filter(
        Product.quantity > 0, Product.quantity <= LOW_STOCK_THRESHOLD
    ).scalar()
    out_of_stock = db.query(func.count(Product.id)).filter(Product.quantity == 0).scalar()
    total = db.query(func.count(Product.id)).scalar()
    return {"healthy": healthy, "low": low, "out_of_stock": out_of_stock, "total": total}


@router.get("/top-products")
def top_products(db: Session = Depends(get_db)):
    results = db.query(
        Product.name,
        func.sum(OrderItem.quantity).label("total_sold")
    ).join(OrderItem, Product.id == OrderItem.product_id)\
     .group_by(Product.id, Product.name)\
     .order_by(func.sum(OrderItem.quantity).desc())\
     .limit(5).all()
    return [{"name": r.name, "total_sold": int(r.total_sold)} for r in results]


@router.get("/low-stock-products")
def low_stock_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.quantity <= LOW_STOCK_THRESHOLD).order_by(Product.quantity).all()
    return [{"id": p.id, "name": p.name, "sku": p.sku, "price": p.price, "quantity": p.quantity} for p in products]
