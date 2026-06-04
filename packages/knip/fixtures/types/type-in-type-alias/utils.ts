export type Address = {
  street: string;
  city: string;
};

export interface Contact {
  email: string;
}

export type UserInfo = {
  name: string;
  address: Address;
  contact: Contact;
};

export interface Employee extends Contact {
  role: string;
}
