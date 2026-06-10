export const departments = [
  { id: "NET", name: "Network Operations", budget: 12_500_000, spent: 8_750_000 },
  { id: "IT", name: "IT & Digital", budget: 8_200_000, spent: 6_950_000 },
  { id: "MKT", name: "Marketing", budget: 4_500_000, spent: 3_200_000 },
  { id: "HR", name: "Human Resources", budget: 2_100_000, spent: 1_450_000 },
  { id: "FIN", name: "Finance", budget: 1_800_000, spent: 980_000 },
  { id: "OPS", name: "Field Operations", budget: 6_400_000, spent: 5_900_000 },
];

export const monthlyTrend = [
  { month: "Jan", capex: 1.8, opex: 1.2, budget: 2.4 },
  { month: "Feb", capex: 2.1, opex: 1.4, budget: 2.4 },
  { month: "Mar", capex: 1.9, opex: 1.5, budget: 2.4 },
  { month: "Apr", capex: 2.4, opex: 1.6, budget: 2.4 },
  { month: "May", capex: 2.7, opex: 1.7, budget: 2.4 },
  { month: "Jun", capex: 2.3, opex: 1.8, budget: 2.4 },
  { month: "Jul", capex: 2.6, opex: 1.9, budget: 2.4 },
  { month: "Aug", capex: 2.9, opex: 2.0, budget: 2.4 },
  { month: "Sep", capex: 2.5, opex: 1.8, budget: 2.4 },
  { month: "Oct", capex: 2.8, opex: 2.1, budget: 2.4 },
  { month: "Nov", capex: 3.1, opex: 2.2, budget: 2.4 },
  { month: "Dec", capex: 3.4, opex: 2.4, budget: 2.4 },
];

export const approvalTimes = [
  { stage: "Manager", manual: 3.2, ai: 0.4 },
  { stage: "Finance", manual: 5.1, ai: 0.7 },
  { stage: "Executive", manual: 4.8, ai: 1.1 },
  { stage: "Total", manual: 13.1, ai: 2.2 },
];

export type RequestStatus = "Submitted" | "Manager Review" | "Finance Review" | "Executive Approval" | "Approved" | "Rejected";
export type RequestType = "CAPEX" | "OPEX";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type AIRecommendation = "Approve" | "Review" | "Reject";
export type RiskScore = "Low" | "Medium" | "High";

export interface BudgetRequest {
  id: string;
  project: string;
  department: string;
  type: RequestType;
  category: string;
  amount: number;
  priority: Priority;
  status: RequestStatus;
  submittedBy: string;
  submittedOn: string;
  justification: string;
  aiRecommendation: AIRecommendation;
  aiRisk: RiskScore;
  aiReason: string;
}

export const requests: BudgetRequest[] = [
  {
    id: "REQ-2026-0142",
    project: "5G Tower Expansion - Abu Dhabi East",
    department: "Network Operations",
    type: "CAPEX",
    category: "Infrastructure",
    amount: 1_850_000,
    priority: "High",
    status: "Executive Approval",
    submittedBy: "Ahmed Al Mansoori",
    submittedOn: "2026-06-02",
    justification: "Expand 5G coverage to support enterprise customers in eastern region. ROI projected at 18 months.",
    aiRecommendation: "Approve",
    aiRisk: "Low",
    aiReason: "Within Q2 CAPEX envelope (74% utilized). Historical projects of this scale closed within +3% of budget. Strong alignment with FY26 5G strategic plan.",
  },
  {
    id: "REQ-2026-0141",
    project: "Customer Care AI Platform Upgrade",
    department: "IT & Digital",
    type: "CAPEX",
    category: "Software & Licenses",
    amount: 620_000,
    priority: "Medium",
    status: "Finance Review",
    submittedBy: "Fatima Khalid",
    submittedOn: "2026-06-05",
    justification: "License renewal and capacity expansion for customer service AI to support 30% volume growth.",
    aiRecommendation: "Approve",
    aiRisk: "Low",
    aiReason: "Recurring license under negotiated framework. 12% lower than vendor list price.",
  },
  {
    id: "REQ-2026-0140",
    project: "Q3 Brand Campaign - World Cup Tie-in",
    department: "Marketing",
    type: "OPEX",
    category: "Advertising",
    amount: 1_200_000,
    priority: "High",
    status: "Manager Review",
    submittedBy: "Reem Saeed",
    submittedOn: "2026-06-06",
    justification: "Sponsorship-aligned campaign across digital, OOH and broadcast for Q3 acquisition push.",
    aiRecommendation: "Review",
    aiRisk: "Medium",
    aiReason: "Marketing OPEX at 71% YTD with 6 months remaining. Recommend phasing or reallocating from Q4 reserve.",
  },
  {
    id: "REQ-2026-0139",
    project: "Fiber Backbone Maintenance Contract",
    department: "Field Operations",
    type: "OPEX",
    category: "Maintenance",
    amount: 480_000,
    priority: "Critical",
    status: "Approved",
    submittedBy: "Khalid Rashid",
    submittedOn: "2026-05-28",
    justification: "Annual maintenance for core fiber backbone covering UAE northern emirates.",
    aiRecommendation: "Approve",
    aiRisk: "Low",
    aiReason: "Critical operational continuity. Contract value 4% below prior year after renegotiation.",
  },
  {
    id: "REQ-2026-0138",
    project: "Executive Off-site Retreat",
    department: "Human Resources",
    type: "OPEX",
    category: "Travel & Events",
    amount: 145_000,
    priority: "Low",
    status: "Rejected",
    submittedBy: "Mariam Hassan",
    submittedOn: "2026-05-25",
    justification: "Annual leadership alignment off-site for 40 senior managers.",
    aiRecommendation: "Reject",
    aiRisk: "High",
    aiReason: "HR Travel & Events budget already 92% utilized. Comparable virtual/hybrid format saved AED 110K in FY25.",
  },
  {
    id: "REQ-2026-0137",
    project: "Data Center Cooling Upgrade",
    department: "IT & Digital",
    type: "CAPEX",
    category: "Infrastructure",
    amount: 920_000,
    priority: "High",
    status: "Approved",
    submittedBy: "Omar Bin Saif",
    submittedOn: "2026-05-20",
    justification: "Cooling capacity required for new GPU cluster deployment.",
    aiRecommendation: "Approve",
    aiRisk: "Low",
    aiReason: "Direct dependency on approved AI platform CAPEX. Energy savings of ~AED 180K/year offset.",
  },
  {
    id: "REQ-2026-0136",
    project: "Roaming Partner Settlement",
    department: "Finance",
    type: "OPEX",
    category: "Inter-carrier",
    amount: 310_000,
    priority: "Medium",
    status: "Submitted",
    submittedBy: "Layla Ibrahim",
    submittedOn: "2026-06-07",
    justification: "Quarterly settlement for international roaming partners.",
    aiRecommendation: "Approve",
    aiRisk: "Low",
    aiReason: "Recurring obligation. Volume in line with seasonal trend.",
  },
];

export const totals = {
  approvedBudget: 35_500_000,
  pendingRequests: 14,
  capexUtilization: 68,
  opexUtilization: 74,
  variance: -3.2,
  aiSavings: 2_840_000,
};

export const aiForecasts = [
  { label: "EOY CAPEX Forecast", value: "AED 34.8M", delta: "-2.1% vs budget", positive: true },
  { label: "EOY OPEX Forecast", value: "AED 26.4M", delta: "+4.6% vs budget", positive: false },
  { label: "Projected Cash Outflow Q4", value: "AED 18.2M", delta: "Within reserve", positive: true },
  { label: "Cost-saving Opportunities", value: "AED 2.84M", delta: "12 initiatives", positive: true },
];