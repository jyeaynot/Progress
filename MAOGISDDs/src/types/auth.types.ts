export interface CurrentUserProfile {
  id: string;
  fullName: string;
  role: string;
  office: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUserResponse {
  data: {
    user: {
      id: string;
      email: string | null;
    };
    profile: CurrentUserProfile | null;
  };
}

