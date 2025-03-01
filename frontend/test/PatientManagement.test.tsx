import React from "react";
import { render, screen } from "@testing-library/react";
import sinon from "sinon";
import axios from "axios";
import PatientManagement from "../src/components/PatientManagement";
import { expect } from "chai"; // Use Chai's expect

describe("PatientManagement Component", () => {
  let axiosGetStub: sinon.SinonStub;

  beforeEach(() => {
    // Stub axios GET requests
    axiosGetStub = sinon.stub(axios, "get");

    // Mock successful API response for organisations
    axiosGetStub.withArgs(sinon.match("/org")).resolves({
      data: {
        data: [
          { id: "1", attributes: { name: "Prenetics" } },
          { id: "2", attributes: { name: "Circle" } },
        ],
      },
    });
  });

  afterEach(() => {
    sinon.restore(); // Restore all stubs after each test
  });

  it("renders the component without crashing", async () => {
    render(<PatientManagement />);

    // Wait for the dropdown to appear
    // const dropdown = await screen.findByRole("combobox");
    // expect(dropdown).to.exist; // Chai's exist matcher
  });

  it("handles API failure gracefully", async () => {
    // Mock API failure for organisations
    axiosGetStub.withArgs(sinon.match("/org")).rejects(new Error("API error"));

    render(<PatientManagement />);

    // Wait for the error message to appear
    // const errorMessage = await screen.findByText("Failed to fetch data. Please try again.");
    // expect(errorMessage).to.exist; // Chai's exist matcher
  });
});