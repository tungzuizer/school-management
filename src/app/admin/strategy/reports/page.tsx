"use server";

import React from "react";
import ReportsClient from "./ReportsClient";
import { getStrategyReportData } from "../evidences/actions";

export default async function ReportsPage() {
  const result = await getStrategyReportData("STRATEGY_5Y");
  const initialData = (result.success ? result : null) as any;

  return <ReportsClient initialData={initialData} />;
}
