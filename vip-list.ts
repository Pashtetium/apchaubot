interface VipUsers {
  [key: number]: string;
}

export function isVipUser(id: number | undefined): boolean {
  if (!id) {
    return false;
  }

  const users: VipUsers = {
    187544508: "donraul0207",
    986068685: "pashtetium",
    819445530: "Myrzakhmet1",
    1866151537: "sugarbeiby",
    998133479: "kavelpim123",
    390057766: "ddarzox",
    452389199: "acoool",
    1244303750: "biqontie",
    607477219: "DihanB",
    395014965: "A3300532",
    586849836: "SagnaAlvarez",
    970301418: "maskoffffff",
    1658306772: "MrRobotDumbazz",
  };

  return !!users[id];
}
