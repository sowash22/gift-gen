export interface Gift {
  id: string;
  name: string;
  description: string;
  estimatedPrice?: number;
  links: string[];
  images: string[];
}

export interface GenerateGiftsRequest {
  recipient?: string;
  occasion?: string;
  vibe?: string[];
  description?: string;
  previouslyGeneratedGifts?: string[];
  budget?: number;
}
