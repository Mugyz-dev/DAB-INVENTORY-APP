import { useEffect, useState } from 'react';
import api from '../api/client';

function Stat({ label, value, color='primary' }) {
  return (
    <div className="col-md-3 mb-3">
      <div className={`card border-0 shadow-sm border-start border-${color} border-4`}>
        <div className="card-body">
          <div className="text-muted small">{label}</div>
          <div className="h3 mb-0">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard/summary').then(r => setData(r.data)); }, []);
  if (!data) return <div>Loading…</div>;
  return (
    <div>
      <h4 className="mb-3">Didier's Choice Dashboard</h4>
      <div className="row">
        <Stat label="Today's Sales" value={data.today_sales.toLocaleString()} color="success" />
        <Stat label="Today's Orders" value={data.today_orders} color="info" />
        <Stat label="Meat Items" value={data.total_products} color="primary" />
        <Stat label="Low Stock" value={data.low_stock} color="danger" />
        <Stat label="Expiring Soon" value={data.expiring_soon} color="warning" />
        <Stat label="Stock Value" value={Number(data.stock_value || 0).toLocaleString()} color="secondary" />
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">Top meat cuts (30 days)</h6>
              <table className="table table-sm">
                <thead><tr><th>Meat item</th><th className="text-end">Qty</th><th className="text-end">Revenue</th></tr></thead>
                <tbody>
                  {data.top_products.map((p,i)=>(
                    <tr key={i}><td>{p.name}</td><td className="text-end">{p.qty_sold}</td>
                      <td className="text-end">{Number(p.revenue).toLocaleString()}</td></tr>
                  ))}
                  {!data.top_products.length && <tr><td colSpan="3" className="text-muted text-center">No sales yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">Sales last 7 days</h6>
              <table className="table table-sm">
                <thead><tr><th>Day</th><th className="text-end">Revenue</th></tr></thead>
                <tbody>
                  {data.sales_by_day.map((d,i)=>(
                    <tr key={i}><td>{new Date(d.day).toLocaleDateString()}</td>
                      <td className="text-end">{Number(d.revenue).toLocaleString()}</td></tr>
                  ))}
                  {!data.sales_by_day.length && <tr><td colSpan="2" className="text-muted text-center">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
