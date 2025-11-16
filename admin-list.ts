interface AdminUsers {
  [key: number]: string;
}

export function isAdmin(id: number | undefined): boolean {
  if (!id) {
    return false;
  }

  const users: AdminUsers = {
    986068685: "pashtetium",
  };

  return !!users[id];
}
