export type Slide = {
  label: string;
  title: string;
  body: string;
  cards: { title: string; body: string }[];
  video?: boolean;
  videoLinkLabel?: string;
  repositoryLabel?: string;
  media?: { src: string; alt: string; caption: string };
};
