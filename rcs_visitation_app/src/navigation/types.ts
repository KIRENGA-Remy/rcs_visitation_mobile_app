export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

export type VisitorTabParamList = {
  Home:          undefined;
  MyRequests:    undefined;
  Notifications: undefined;
  Profile:       undefined;
};

export type VisitorStackParamList = {
  VisitorTabs: undefined;
  BookVisit:      undefined;
  RequestDetail:  { id: string };
  Notifications:  undefined;
  Profile:        undefined;
};

export type OfficerStackParamList = {
  OfficerDashboard:   undefined;
  PendingRequests:    undefined;
  ReviewRequest:      { id: string };
  ScanQR:             undefined;
  CheckIn:            { visitRequestId: string };
  CheckOut:           { visitRequestId: string };
  VisitLogs:          undefined;
  Notifications:      undefined;
  Profile:            undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  Users:          undefined;
  Prisoners:      undefined;
  Schedules:      undefined;
  Reports:        undefined;
  AdminLogs:      undefined;
  Notifications:  undefined;
  Profile:        undefined;
};

export type RootStackParamList = {
  Auth:    undefined;
  Visitor: undefined;
  Officer: undefined;
  Admin:   undefined;
};
