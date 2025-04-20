export const fetchNextPriority = async (
    date: string,
    formType: "depthAverage" | "fragmentation"
  ): Promise<number | null> => {
    try {
      const endpoint =
        formType === "depthAverage"
          ? `http://localhost:5180/api/DepthAverage/next-priority?tanggal=${date}`
          : `http://localhost:5180/api/Fragmentation/next-priority?tanggal=${date}`;
  
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch");
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error fetching next priority:", error);
      return null;
    }
  };
   
  export const fetchUsedPriorities = async (
    date: string,
    formType: "depthAverage" | "fragmentation"
  ): Promise<number[]> => {
    try {
      const endpoint =
        formType === "depthAverage"
          ? `http://localhost:5180/api/DepthAverage/used-priorities?tanggal=${date}`
          : `http://localhost:5180/api/Fragmentation/used-priorities?tanggal=${date}`;
  
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch");
  
      const used: number[] = await response.json();
      return used;
    } catch (error) {
      console.error("Error fetching used priorities:", error);
      return [];
    }
  };
  