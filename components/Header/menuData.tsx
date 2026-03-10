import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    jumpTo: "home",
    newTab: false,
  },
  // {
  //   id: 2,
  //   title: "Blog",
  //   path: "/blog",
  //   newTab: false,
  // },
{
    id: 3,
    title: "Demo",
    path: "/demo",
    newTab: false,
  },
  {
    id: 4,
    title: "Contact",
    jumpTo: "contact",
    newTab: false,
  },
];
export default menuData;
