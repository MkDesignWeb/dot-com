export type TimeResponse = {
  serverTime: number;
};

export type PunchPayload = {
  punch?: {
    id: number;
    employeeId: number;
    employeeName: string;
    timeStamp: string;
    displayTimeBr: string;
    reportDayBr: string;
    reportTimeBr: string;
  };
  systemDisplayDateBr?: string;
  punchDisplayTimeBr?: string;
};

export type PunchResponse = {
  systemLocalDate?: string;
} & PunchPayload;
