import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome:  undefined;
  Login:    undefined;
  Register: undefined;
  ActivateAccount: undefined;
};

export type VisitorTabParamList = {
  Home:          undefined;
  MyRequests:    undefined;
  Notifications: undefined;
  Profile:       undefined;
};

export type VisitorStackParamList = {
  VisitorTabs: NavigatorScreenParams<VisitorTabParamList> | undefined;
  BookVisit:      undefined;
  RequestDetail:  { id: string };
  Notifications:  undefined;
  NotificationDetail: { notification: any };
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

export type OfficerTabParamList = {
  Dashboard:     undefined;
  PendingRequests: { initialTab?: 'PENDING' | 'APPROVED' | 'CHECKED_IN' | 'COMPLETED' | 'EXPIRED' } | undefined;
  Notifications: undefined;
  Profile:       undefined;
};

export type OfficerStackParamList = {
  OfficerTabs:        NavigatorScreenParams<OfficerTabParamList> | undefined;
  ContactRequests:    undefined;
  MyReports:          undefined;
  ReportUpload:       { reportRequestId?: string; presetTitle?: string } | undefined;
  Schedules:          undefined;
  ScheduleForm:       { id?: string } | undefined;
  ReportViewer:       { fileUrl: string; fileName: string; fileMimeType?: string };
  ReviewRequest:      { id: string };
  ScanQR:             undefined;
  CheckIn:            { visitRequestId: string };
  CheckOut:           { visitRequestId: string };
  VisitLogs:          undefined;
  Notifications:      undefined;
  NotificationDetail: { notification: any };
  Profile:            undefined;
  Help:               undefined;
  About:              undefined;
  EditProfile:          undefined;
  ChangePassword:       undefined;
  NotificationSettings: undefined;
  PrivacySecurity:      undefined;
};

export type AdminTabParamList = {
  Dashboard:     undefined;
  Users:         undefined;
  Notifications: undefined;
  Profile:       undefined;
};

export type AdminStackParamList = {
  AdminTabs:      NavigatorScreenParams<AdminTabParamList> | undefined;
  CreateOfficer:  undefined;
  CreateAdmin:    undefined;
  Prisoners:      undefined;
  PrisonerDetail: { id: string };
  PrisonerForm:   { id?: string } | undefined;
  Schedules:      undefined;
  ScheduleForm:   { id?: string } | undefined;
  Reports:        undefined;
  SubmittedReports: undefined;
  ReportViewer:     { fileUrl: string; fileName: string; fileMimeType?: string };
  RequestReport:    undefined;
  Notifications:  undefined;
  NotificationDetail: { notification: any };
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
