export interface CaptchaID {
  id: string;
}

export interface CaptchaAPIContextType {
  generateCaptcha: () => Promise<CaptchaID>;
}

export interface CaptchaAnswer {
  id: string;
  answer: string;
}
