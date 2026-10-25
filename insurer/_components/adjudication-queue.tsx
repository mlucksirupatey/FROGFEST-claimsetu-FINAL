import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClaimRecord {
  id: string;
  claimant: string;
  policyNo: string;
  hospital: string;
  claimedNpr: number;
  approvedNpr: number;
  status: "verified" | "flagged" | "scrubbing";
  daysRemaining: number;
  ocrScore: number;
}

const mockClaims: ClaimRecord[] = [
  {
    id: "CLM-2081-0941",
    claimant: "Sita Sharma",
    policyNo: "SHIK-HLTH-8820",
    hospital: "Grande International Hospital, Dhapasi",
    claimedNpr: 184500,
    approvedNpr: 172000,
    status: "verified",
    daysRemaining: 26,
    ocrScore: 99.4,
  },
  {
    id: "CLM-2081-0940",
    claimant: "Bikash Adhikari",
    policyNo: "SALICO-IND-4192",
    hospital: "Nepal Mediciti Hospital, Bhaisepati",
    claimedNpr: 320000,
    approvedNpr: 285000,
    status: "flagged",
    daysRemaining: 18,
    ocrScore: 92.1,
  },
  {
    id: "CLM-2081-0938",
    claimant: "Rajesh Thapa",
    policyNo: "SHIK-HLTH-7711",
    hospital: "Bir Hospital, Kathmandu",
    claimedNpr: 45000,
    approvedNpr: 45000,
    status: "verified",
    daysRemaining: 29,
    ocrScore: 98.7,
  },
  {
    id: "CLM-2081-0935",
    claimant: "Anjali KC",
    policyNo: "SALICO-CORP-0112",
    hospital: "Norvic International Hospital",
    claimedNpr: 540000,
    approvedNpr: 0,
    status: "scrubbing",
    daysRemaining: 12,
    ocrScore: 88.5,
  },
];

export function AdjudicationQueue() {
  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-medium uppercase">
              Pending Ingestion
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">14</div>
          <span className="text-[11px] text-emerald-700 font-mono flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> Auto-scrubbed in &lt; 48s
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-medium uppercase">
              30-Day SLA Watch
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">03</div>
          <span className="text-[11px] text-amber-700 font-mono flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3 h-3" /> &lt; 14 days statutory grace
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-medium uppercase">
              Deterministic OCR
            </span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            98.2%
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Devanagari VAT & bills
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-mono font-medium uppercase">
              Zero-Penalty Score
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            100%
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Nepal Ins. Act Sec 123
          </span>
        </div>
      </div>

      {/* Claims Ledger Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Active Adjudication Ledger
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Live claims awaiting settlement certification
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Filter:</span>
            <Badge variant="emerald" className="cursor-pointer">
              All Active (4)
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-slate-50">
              Flags Only (1)
            </Badge>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-600 font-mono text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Claim ID</th>
                <th className="py-3 px-4 font-semibold">Claimant / Policy</th>
                <th className="py-3 px-4 font-semibold">Provider Hospital</th>
                <th className="py-3 px-4 font-semibold text-right">Claimed</th>
                <th className="py-3 px-4 font-semibold">Statutory SLA</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockClaims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {claim.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {claim.claimant}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      {claim.policyNo}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 text-xs font-sans">
                    {claim.hospital}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                    NPR {claim.claimedNpr.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span
                        className={
                          claim.daysRemaining < 15
                            ? "text-amber-700 font-bold"
                            : "text-slate-700"
                        }
                      >
                        {claim.daysRemaining}d left
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {claim.status === "verified" && (
                      <Badge variant="emerald">Clean Trace</Badge>
                    )}
                    {claim.status === "flagged" && (
                      <Badge variant="rose">Disputed Item</Badge>
                    )}
                    {claim.status === "scrubbing" && (
                      <Badge variant="amber">OCR Scrubbing</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/insurer/claims/${claim.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                    >
                      <span>Review</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
