import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

// Define the structure of the API responses
interface Organisation {
  id: string;
  name: string;
}

interface SampleAttributes {
  result: string;
  sampleId: string;
  resultType: string;
  activateTime: string;
  resultTime: string;
}

interface RelationshipData {
  type: string;
  id: string;
}

interface Patient {
  id: string;
  type: string;
  attributes: SampleAttributes;
  relationships: {
    profile: {
      data: RelationshipData;
    };
  };
}

interface Profile {
  type: string;
  id: string;
  attributes: {
    name: string;
  };
}

interface EnrichedPatient {
  name: string;
  sampleId: string;
  activateTime: string;
  resultTime: string;
  result: string;
  resultType?: string; // Optional for Circle
  id?: string; // Optional for Circle (Patient ID)
}

const PatientManagement: React.FC = () => {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [data, setData] = useState<EnrichedPatient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const resultsPerPage = 15;

  // Fetch organisations
  const fetchOrganisations = async () => {
    try {
      const response = await axios.get<{ data: { id: string; attributes: { name: string } }[] }>(
        "http://localhost:8080/test/v1.0/org"
      );

      const orgs = response.data.data.map((org) => ({
        id: org.id,
        name: org.attributes.name,
      }));
      setOrganisations(orgs);
      setSelectedOrg(orgs[0]); // Default to the first organisation
    } catch (err) {
      setError("Failed to fetch organisations.");
    }
  };

  // Fetch patient data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{
        data: Patient[];
        included: Profile[];
      }>(
        `http://localhost:8080/test/v1.0/org/${selectedOrg?.id}/sample`
      );

      const rawData = response.data.data;
      const profiles = response.data.included;

      const enrichedData = rawData.map((item) => {
        const profileId = item.relationships.profile.data.id;
        const profile = profiles.find((p) => p.id === profileId);
        return {
          name: profile ? profile.attributes.name : "Unknown",
          sampleId: item.attributes.sampleId,
          activateTime: item.attributes.activateTime,
          resultTime: item.attributes.resultTime,
          result: item.attributes.result,
          ...(selectedOrg?.name === "Circle" && {
            resultType: item.attributes.resultType,
            id: item.id,
          }),
        };
      });

      setData(enrichedData);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchData();
    }
  }, [selectedOrg]);

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Tokenize search input and filter data
  const filteredData = useMemo(() => {
    const tokens = debouncedSearch
      .split(";") // Split input by `;`
      .map((token) => token.trim().toLowerCase()) // Trim and lowercase tokens
      .filter((token) => token); // Remove empty tokens

    if (tokens.length === 0) {
      return data; // If no tokens, return all data
    }

    return data.filter((item) =>
      tokens.every((token) => {
        // Check if every token matches any property of the patient
        return (
          item.name.toLowerCase().includes(token) || // Match name
          item.sampleId.toLowerCase().includes(token) || // Match sample barcode
          item.activateTime.toLowerCase().includes(token) || // Match activation date
          item.resultTime.toLowerCase().includes(token) || // Match result date
          item.result.toLowerCase().includes(token) || // Match result
          (item.id && item.id.toLowerCase().includes(token)) || // Match patient ID (Circle only)
          (item.resultType && item.resultType.toLowerCase().includes(token)) // Match result type (Circle only)
        );
      })
    );
  }, [data, debouncedSearch]);

  // Paginate data based on the current page
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, resultsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredData.length / resultsPerPage);

  // Define table columns dynamically
  const columns: ColumnDef<EnrichedPatient>[] = useMemo(() => {
    const baseColumns: ColumnDef<EnrichedPatient>[] = [
      { accessorKey: "name", header: "Patient Name" },
      { accessorKey: "sampleId", header: "Sample Barcode" },
      { accessorKey: "activateTime", header: "Activation Date" },
      { accessorKey: "resultTime", header: "Result Date" },
      { accessorKey: "result", header: "Result Value" },
    ];
    if (selectedOrg?.name === "Circle") {
      baseColumns.push(
        { accessorKey: "resultType", header: "Result Type" },
        { accessorKey: "id", header: "Patient ID" }
      );
    }
    return baseColumns;
  }, [selectedOrg]);

  // Use Tanstack Table
  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        {/*<h1 className="text-2xl font-bold">Patient Management</h1>*/}
        {/* Organisation Dropdown */}
        <span>
          Your Organisation: 
        </span>
        <select
          value={selectedOrg?.id}
          onChange={(e) =>
            setSelectedOrg(
              organisations.find((org) => org.id === e.target.value) || null
            )
          }
          className="border border-gray-300 rounded p-2"
        >
          {organisations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>
      {/* Search Bar */}
      <span>
        Search by: 
      </span>
      <input
        type="text"
        placeholder={`${
          selectedOrg?.name === "Circle" ? "Patient ID, " : ""
        }name, barcode, date, etc. adfsdfsadfsdfasdf`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-gray-300 rounded p-2 mb-4 w-full max-w-screen-xl"
      /><span> separate multiple search criteria with ";"</span>
      {/* Table */}
      <table className="table-auto border-collapse border border-gray-300 w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border border-gray-300 bg-gray-100 p-2 text-left"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-100">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="border border-gray-300 p-2 text-left"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded ${
            currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-green-500 text-white"
          }`}
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded ${
            currentPage === totalPages
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-500 text-white"
          }`}
        >
          Next
        </button>
      </div>
      {/* Footer */}
      <p className="text-sm text-gray-600 mt-4">
        Showing {paginatedData.length} of {filteredData.length} results
      </p>
    </div>
  );
};

export default PatientManagement;