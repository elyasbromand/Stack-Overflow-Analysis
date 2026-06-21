export const defaultFilters = {
  startYear: "2014",
  endYear: "2025",
  startMonth: "all",
  endMonth: "all",
  categoryType: "all",
  chartType: "line",
  sortOrder: "desc",
};

export const months = [
  { label: "Jan", value: "01" },
  { label: "Feb", value: "02" },
  { label: "Mar", value: "03" },
  { label: "Apr", value: "04" },
  { label: "May", value: "05" },
  { label: "Jun", value: "06" },
  { label: "Jul", value: "07" },
  { label: "Aug", value: "08" },
  { label: "Sep", value: "09" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" },
];

export const categoryTypes = [
  { label: "All", value: "all" },
  { label: "Infrastructure", value: "infra" },
  { label: "Application", value: "app" },
  { label: "Data", value: "data" },
  { label: "AI / ML", value: "ai" },
];

export const chartOptions = [
  { label: "Line", value: "line" },
  { label: "Bar", value: "bar" },
  { label: "Area", value: "area" },
  { label: "Pie", value: "pie" },
];
