export interface TransportRoute {
  id?: number;
  name: string;
  start_point: string;
  end_point: string;
  stops?: string; // comma separated
  created_at?: string;
}

export interface Bus {
  id?: number;
  number_plate: string;
  capacity: number;
  driver_name: string;
  contact?: string;
  route?: number | TransportRoute; // either id or nested object
  created_at?: string;
}

export interface StudentTransport {
  id?: string;  // kyunki tumhari API string id bhej rahi hai
  student: string | { id: string; username?: string; first_name?: string; last_name?: string };
  bus: string | number | { id: string | number; number_plate?: string };
  pickup_point: string;
}