export type Menu = {
  id: number;
  title: string;
  jumpTo?: string;
  path?: string;
  newTab: boolean;
  submenu?: Menu[];
};
