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
  Contacts:       undefined;
  Help:           undefined;
  About:          undefined;
  RequestVisit:   undefined;
  EditProfile:          undefined;
  ChangePassword:       undefined;
  NotificationSettings: undefined;
  PrivacySecurity:      undefined;
};

export type OfficerStackParamList = {
  OfficerDashboard:   undefined;
  PendingRequests:    { initialTab?: 'PENDING' | 'APPROVED' | 'CHECKED_IN' | 'COMPLETED' } | undefined;
  ContactRequests:    undefined;
  ReviewRequest:      { id: string };
  ScanQR:             undefined;
  CheckIn:            { visitRequestId: string };
  CheckOut:           { visitRequestId: string };
  VisitLogs:          undefined;
  Notifications:      undefined;
  Profile:            undefined;
  Help:               undefined;
  About:              undefined;
  EditProfile:          undefined;
  ChangePassword:       undefined;
  NotificationSettings: undefined;
  PrivacySecurity:      undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  Users:          undefined;
  Prisoners:      undefined;
  PrisonerDetail: { id: string };
  PrisonerForm:   { id?: string } | undefined;
  Schedules:      undefined;
  Reports:        undefined;
  AdminLogs:      undefined;
  ContactRequests:undefined;
  Notifications:  undefined;
  Profile:        undefined;
  Help:           undefined;
  About:          undefined;
  EditProfile:          undefined;
  ChangePassword:       undefined;
  NotificationSettings: undefined;
  PrivacySecurity:      undefined;
};

export type RootStackParamList = {
  Auth:    undefined;
  Visitor: undefined;
  Officer: undefined;
  Admin:   undefined;
};
