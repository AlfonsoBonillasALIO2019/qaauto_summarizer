import React from "react";
import { DataGrid } from "@mui/x-data-grid";

export const Table = ({ columns, rows, loading }) => {
  return (
    <div style={{ height: 400, padding: 30 }} >
      <DataGrid rows={rows} columns={columns} rowsPerPageOptions={[100]} loading={loading} />
    </div>
  );
};
