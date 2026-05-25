import { useState } from 'react';
import api from '../api/client';

function download(path, filename) {
  const token = localStorage.getItem('dab_token');
  fetch(`${api.defaults.baseURL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.blob())
    .then(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = filename; a.click();
    });
}

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const qs = new URLSearchParams();
  if (from) qs.append('from', from);
  if (to) qs.append('to', to);
  const q = qs.toString() ? `?${qs.toString()}` : '';

  return (
    <div>
      <h4>Butcher Reports</h4>
      <div className="card card-body shadow-sm mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small mb-0">From</label>
            <input type="date" className="form-control" value={from} onChange={e=>setFrom(e.target.value)}/>
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-0">To</label>
            <input type="date" className="form-control" value={to} onChange={e=>setTo(e.target.value)}/>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card card-body shadow-sm h-100">
            <h6>Sales report (PDF)</h6>
            <p className="text-muted small">Sales, credit status, balances and totals in selected period.</p>
            <button className="btn btn-outline-primary"
              onClick={()=>download(`/reports/sales.pdf${q}`,'didier-choice-sales-report.pdf')}>Download PDF</button>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-body shadow-sm h-100">
            <h6>Sales report (Excel)</h6>
            <p className="text-muted small">Same sales data as XLSX for analysis.</p>
            <button className="btn btn-outline-success"
              onClick={()=>download(`/reports/sales.xlsx${q}`,'didier-choice-sales-report.xlsx')}>Download Excel</button>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-body shadow-sm h-100">
            <h6>Butcher inventory report (Excel)</h6>
            <p className="text-muted small">Current stock, batches, storage locations and expiry dates.</p>
            <button className="btn btn-outline-success"
              onClick={()=>download(`/reports/inventory.xlsx`,'didier-choice-inventory-report.xlsx')}>Download Excel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
