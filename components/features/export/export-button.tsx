"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Loader2, Download, FileText, Sheet } from "lucide-react"
import { getGroupExportData, type ExportRow } from "@/app/actions/export"

interface ExportButtonProps {
  groupId: string
  groupName: string
}

/**
 * ExportButton
 *
 * Provides CSV and "Bank Statement" PDF-style export options.
 *
 * CSV: Uses browser Blob API (no extra dependency).
 * PDF: Generates a styled HTML document, then triggers window.print()
 *      with a print-specific CSS media query — produces a clean PDF
 *      without any PDF library dependencies.
 */
export function ExportButton({ groupId, groupName }: ExportButtonProps) {
  const [isPending, startTransition] = useTransition()

  function fetchAndExport(type: "csv" | "pdf") {
    startTransition(async () => {
      const result = await getGroupExportData(groupId)

      if (!result.success || !result.rows) {
        toast.error(result.error || "Export failed")
        return
      }

      if (type === "csv") {
        downloadCSV(result.rows, result.groupName!, result.generatedAt!)
      } else {
        printPDF(result.rows, result.groupName!, result.generatedAt!)
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending} id="export-btn" className="rounded-full border-2">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem
          id="export-csv"
          onClick={() => fetchAndExport("csv")}
          disabled={isPending}
          className="gap-2"
        >
          <Sheet className="h-4 w-4 text-emerald-500" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          id="export-pdf"
          onClick={() => fetchAndExport("pdf")}
          disabled={isPending}
          className="gap-2"
        >
          <FileText className="h-4 w-4 text-primary" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── CSV ───────────────────────────────────────────────────────────────────────

function downloadCSV(rows: ExportRow[], groupName: string, generatedAt: string) {
  const headers = ["Date", "Type", "Description", "Amount", "Paid By", "Group"]
  const csvRows = [
    // Header comment row
    [`# ZAR Ledger — ${groupName} Statement — Generated: ${generatedAt}`],
    headers,
    ...rows.map((r) => [
      r.date,
      r.type,
      `"${r.description.replace(/"/g, '""')}"`, // Escape quotes
      r.amount,
      `"${r.paidBy}"`,
      `"${r.groupName}"`,
    ]),
  ]

  const csv = csvRows.map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${groupName.replace(/\s+/g, "_")}_statement.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success("CSV downloaded!")
}

// ─── PDF (via browser print) ──────────────────────────────────────────────────

function printPDF(rows: ExportRow[], groupName: string, generatedAt: string) {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td>${r.date}</td>
        <td><span class="badge badge-${r.type.toLowerCase()}">${r.type}</span></td>
        <td>${r.description}</td>
        <td>${r.paidBy}</td>
        <td class="amount">${r.amount}</td>
      </tr>`
    )
    .join("")

  const html = `
<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="UTF-8" />
  <title>${groupName} — ZAR Ledger Statement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #111;
      padding: 40px;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #111;
    }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .logo span { color: #7c3aed; }
    .header-meta { text-align: right; color: #555; font-size: 11px; line-height: 1.8; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    thead tr { background: #f4f4f5; }
    th {
      text-align: left;
      padding: 8px 12px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    .amount { font-weight: 700; font-variant-numeric: tabular-nums; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-expense { background: #ede9fe; color: #7c3aed; }
    .badge-settlement { background: #dcfce7; color: #166534; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }
    @media print {
      body { padding: 20px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">ZAR <span>Ledger</span></div>
      <h1>${groupName}</h1>
      <p style="color:#555;font-size:11px">Group Statement — All Transactions</p>
    </div>
    <div class="header-meta">
      <div>Generated: ${generatedAt}</div>
      <div>Currency: ZAR (South African Rand)</div>
      <div>Total Transactions: ${rows.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Description</th>
        <th>Paid By</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="footer">
    This statement was generated by ZAR Ledger. All amounts are in South African Rand (ZAR).
    This document is for informational purposes only.
  </div>
</body>
</html>`

  const win = window.open("", "_blank")
  if (!win) {
    toast.error("Please allow pop-ups to export PDF.")
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
    toast.success("Print dialog opened — save as PDF!")
  }, 500)
}
