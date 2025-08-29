export interface Gift {
  id: string;
  name: string;
  description: string;
  estimatedPrice: string;
  tags: string[];
}

export const mockGifts: Gift[] = [
  {
    id: "1",
    name: "Customized Star Map",
    description: "A beautiful map of the stars on the night they were born.",
    estimatedPrice: "$50",
    tags: ["sentimental", "unique"],
  },
  {
    id: "2",
    name: "Subscription Box for their Hobby",
    description: "A monthly box of goodies related to their favorite hobby.",
    estimatedPrice: "$30/month",
    tags: ["hobby", "unique"],
  },
  {
    id: "3",
    name: "MasterClass Subscription",
    description: "Learn from the best in the world with a subscription to MasterClass.",
    estimatedPrice: "$180/year",
    tags: ["educational", "experience"],
  },
  {
    id: "4",
    name: "Personalized Photo Album",
    description: "A beautiful album filled with your favorite memories.",
    estimatedPrice: "$75",
    tags: ["sentimental", "diy"],
  },
  {
    id: "5",
    name: "A Weekend Getaway",
    description: "A relaxing weekend away at a cozy cabin or a fancy hotel.",
    estimatedPrice: "$300+",
    tags: ["experience", "luxury"],
  },
  {
    id: "6",
    name: "Engraved Jewelry",
    description: "A beautiful piece of jewelry with a special message.",
    estimatedPrice: "$100+",
    tags: ["sentimental", "luxury"],
  },
  {
    id: "7",
    name: "A Romantic Dinner at a Fancy Restaurant",
    description: "A night to remember with delicious food and a romantic atmosphere.",
    estimatedPrice: "$150+",
    tags: ["experience", "luxury"],
  },
  {
    id: "8",
    name: "Couples Massage or Spa Day",
    description: "A relaxing day of pampering for the two of you.",
    estimatedPrice: "$250+",
    tags: ["experience", "luxury"],
  },
  {
    id: "9",
    name: "A Piece of Art",
    description: "A beautiful piece of art to hang in your home.",
    estimatedPrice: "$100+",
    tags: ["unique", "luxury"],
  },
  {
    id: "10",
    name: "A handwritten love letter",
    description: "A heartfelt letter expressing your love and appreciation.",
    estimatedPrice: "Free",
    tags: ["sentimental", "diy"],
  },
  {
    id: "11",
    name: "Gourmet Gift Basket",
    description: "A basket filled with delicious treats and snacks.",
    estimatedPrice: "$75",
    tags: ["foodie", "classic"],
  },
  {
    id: "12",
    name: "Cozy Blanket and a Good Book",
    description: "The perfect gift for a cozy night in.",
    estimatedPrice: "$50",
    tags: ["cozy", "relaxing"],
  },
  {
    id: "13",
    name: "Smart Home Device",
    description: "A device to make their life easier and more convenient.",
    estimatedPrice: "$50+",
    tags: ["tech", "practical"],
  },
  {
    id: "14",
    name: "DIY Cocktail Kit",
    description: "Everything they need to make their favorite cocktails at home.",
    estimatedPrice: "$50",
    tags: ["diy", "foodie"],
  },
  {
    id: "15",
    name: "Donation to a Charity in their Name",
    description: "A meaningful gift that gives back to a cause they care about.",
    estimatedPrice: "Varies",
    tags: ["charitable", "meaningful"],
  },
  {
    id: "16",
    name: "A Plant or Succulent",
    description: "A beautiful plant to brighten up their home or office.",
    estimatedPrice: "$25",
    tags: ["home", "green"],
  },
  {
    id: "17",
    name: "A High-Quality Water Bottle",
    description: "A durable and stylish water bottle to keep them hydrated.",
    estimatedPrice: "$30",
    tags: ["practical", "health"],
  },
  {
    id: "18",
    name: "A Board Game or Puzzle",
    description: "A fun activity to do with friends and family.",
    estimatedPrice: "$30",
    tags: ["fun", "social"],
  },
  {
    id: "19",
    name: "A Gift Certificate to their Favorite Store",
    description: "The perfect gift for the person who has everything.",
    estimatedPrice: "Varies",
    tags: ["practical", "classic"],
  },
  {
    id: "20",
    name: "A Set of Nice Pens",
    description: "A beautiful set of pens for the writer or artist in your life.",
    estimatedPrice: "$40",
    tags: ["creative", "practical"],
  },
];
