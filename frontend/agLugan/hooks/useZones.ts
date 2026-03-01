import { useEffect, useState } from "react";

export interface Zone {
  id: number;
  longitude: number;
  latitude: number;
  classification: string;
  location: string;
  imageurl: string;
}

export function useZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localUrl = "http://10.0.2.2:8080/api/getzones";

  useEffect(() => {
    async function fetchZones() {
      try {
        const response = await fetch(localUrl);
        const data = await response.json();
        console.log(data);
        setZones(data);
      } catch (err) {
        console.log(err);
        setError("Failed to fetch zones");
      } finally {
        setLoading(false);
      }
    }

    fetchZones();
  }, []);

  return { zones, loading, error };
}
