import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Sales() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/sales').then(r => setList(r.data)); }, []);

  function openInvoice(id) {
    const token = localStorage.getItem('dab_token');
    const url = `${api.defaults.baseURL}/reports/invoice/${id}.pdf`;
    // Open in new tab using fetch + blob so we can pass auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(b => window.open(URL.createObjectURL(b), '_blank'));
  }

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h4 className="mb-0">Sales</h4>
        <Link to="/sales/new" className="btn btn-primary btn-sm">+ New Sale</Link>
      </div>
      <table className="table table-striped table-hover bg-white shadow-sm">
        <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Cashier</th><th>Pay</th>
                   <th className="text-end">Total</th><th></th></tr></thead>
        <tbody>
          {list.map(s=>(
            <tr key={s.id}>
              <td>{s.invoice_number}</td>
              <td>{new Date(s.created_at).toLocaleString()}</td>
              <td>{s.customer_name || '-'}</td>
              <td>{s.cashier}</td>
              <td>{s.payment_method}</td>
              <td className="text-end">{Number(s.total).toLocaleString()}</td>
              <td className="text-end">
                <button className="btn btn-sm btn-outline-primary" onClick={()=>openInvoice(s.id)}>Invoice PDF</button>
              </td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan="7" className="text-center text-muted">No sales yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
