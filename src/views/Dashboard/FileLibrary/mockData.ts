export type FileLibraryMediaType = "image" | "video";

export interface FileLibraryItem {
  id: string;
  type: FileLibraryMediaType;
  title: string;
  src: string;
}

export const FILE_LIBRARY_ITEMS: FileLibraryItem[] = [
  {
    id: "img-1",
    type: "image",
    title: "Image 1",
    src: "/GoNexa_Blog (1).jpg.jpeg",
  },
  {
    id: "img-2",
    type: "image",
    title: "Image 2",
    src: "/GoNexa_Blog (2).jpg.jpeg",
  },
  {
    id: "img-3",
    type: "image",
    title: "Image 3",
    src: "/GoNexa_Blog (3).jpg.jpeg",
  },
  {
    id: "img-4",
    type: "image",
    title: "Image 4",
    src: "/GoNexa_Blog (4).jpg.jpeg",
  },
  {
    id: "img-5",
    type: "image",
    title: "Image 5",
    src: "/GoNexa_Blog (5).jpg.jpeg",
  },
  {
    id: "img-6",
    type: "image",
    title: "Image 6",
    src: "/Mask group.png",
  },
  {
    id: "vid-1",
    type: "video",
    title: "Video 1",
    src: "/Rectangle 3086.png",
  },
  {
    id: "vid-2",
    type: "video",
    title: "Video 2",
    src: "/king.png",
  },
  // duplicates to fill the grid like the screenshot
  {
    id: "img-7",
    type: "image",
    title: "Image 7",
    src: "/GoNexa_Blog (1).jpg.jpeg",
  },
  {
    id: "img-8",
    type: "image",
    title: "Image 8",
    src: "/GoNexa_Blog (2).jpg.jpeg",
  },
  {
    id: "img-9",
    type: "image",
    title: "Image 9",
    src: "/GoNexa_Blog (3).jpg.jpeg",
  },
  {
    id: "img-10",
    type: "image",
    title: "Image 10",
    src: "/GoNexa_Blog (4).jpg.jpeg",
  },
];

