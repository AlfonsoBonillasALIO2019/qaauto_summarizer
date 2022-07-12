import React from "react";
import {
  getJobs,
  getExecutionReport,
  getExecutedJobs,
  getSummarizeReport,
  sendSummaryReport,
} from "../ducks/actions/TestProject.action";
import { Table } from "../components/table";
import { CustomModal as Modal } from "../components/modal";
import { generateChart } from "../ducks/actions/QuickChart.action";
import { percentage } from "../util";
import moment from "moment";
import { AssessmentOutlined } from "@mui/icons-material";
import { Parser } from "html-to-react";
import "./Style.css";

export const ReportView = () => {
  const [jobs, setJobs] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [job, setJob] = React.useState({});
  const [report, setReport] = React.useState("<h1>Hi there!</h1>");
  const [htmlReport, setHTMLReport] = React.useState("");

  const COLUMNS = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
      align: "left",
    },
    {
      field: "description",
      headerName: "Description",
      width: 200,
      align: "left",
    },
    {
      field: "report",
      headerName: "Report",
      width: 200,
      align: "left",
      renderCell: (params) => {
        return (
          params.row.executeID && (
            <div
              style={{ cursor: "pointer" }}
              onClick={() =>
                onHandleGetReport(params.row.id, params.row.executeID)
              }
            >
              <AssessmentOutlined />
            </div>
          )
        );
      },
    },
  ];

  const onHandleGetJobs = React.useCallback(async () => {
    setLoading(true);
    const result = await getJobs();
    const auxArray = [];
    for (const key in result) {
      if (Object.hasOwnProperty.call(result, key)) {
        const element = result[key];
        const executions = await getExecutedJobs(element.id);
        if (executions.length > 0) {
          const lastExecuted = executions.sort(
            (a, b) => new Date(b.executionEnd) - new Date(a.executionEnd)
          )[0];

          auxArray.push({
            ...element,
            executeID: lastExecuted.id,
            report: "",
          });
        } else {
          auxArray.push({ ...element, report: "" });
        }
      }
    }

    setJobs(auxArray);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    onHandleGetJobs();
  }, [onHandleGetJobs]);

  const onHandleGetSummarizeReport = async () => {
    const result = await getSummarizeReport();

    console.log(result)

    let htmlString =
      '<table><thead style="background-color: lightblue;" ><tr><th>Client Name</th><th>Product</th><th><div>Test Cases</div><div style="display: flex; flex-direction: row; justify-content: space-around; align-items: center;"><div style="padding: 5px; background-color: #00e28f;" >Passed</div><div style="padding: 5px; background-color: #fd6460;" >Failed</div><div style="padding: 5px; background-color: darkgray;" >Status</div></div></th></tr></thead><tbody>';

    for (const key in result) {
      if (Object.hasOwnProperty.call(result, key)) {
        const client = result[key];
        let auxString1 =
          "<tr><td style=\"border: 1px solid;\" >" +
          key +
          "</td><td style=\"border: 1px solid;\" ><table style=\"width: 100%;\" ><tbody>";
        for (let index = 0; index < client.jobs.length; index++) {
          const elm = client.jobs[index];

          auxString1 += "<tr><td>" + elm.name + "</td></tr>";

          if (index === client.jobs.length - 1) {
            auxString1 += "</tbody></table></td>";
            htmlString += auxString1;
          }
        }

        let auxString2 = "<td style=\"border: 1px solid;\" ><table style=\"width: 100%;\" ><tbody>";
        for (let index = 0; index < client.jobs.length; index++) {
          const elm = client.jobs[index];

          auxString2 += `<tr>
                          ${
                            !elm.report
                              ? "<td style=\"width: 30%;\" >0</td><td style=\"width: 30%;\" >0</td><td style=\"width: 30%;\" >N/A</td>"
                              : `<td style=\"width: 30%; ${
                            elm.report.passedTests > 0
                              ? "background-color: #00e28f;"
                              : ""
                          }\" >${elm.report.passedTests}</td>
                          <td style=\"width: 30%; ${
                            elm.report.failedTests > 0
                              ? "background-color: #fd6460;"
                              : ""
                          }\" >${elm.report.failedTests}</td>
                          <td style=\"width: 30%; ${
                            elm.report.resultType === "Passed"
                              ? "background-color: #00e28f;"
                              : "background-color: #fd6460;"
                          }\" >${elm.report.resultType}</td>`
                        }</tr>`;

          if (index === client.jobs.length - 1) {
            auxString2 += "</tbody></table></td></tr>";
            htmlString += auxString2;
          }
        }

        console.log(Object.keys(result)[Object.keys(result).length - 1], key);
        if (Object.keys(result)[Object.keys(result).length - 1] === key)
          htmlString += "</tbody></table>";
      }
    }
    setHTMLReport(htmlString.replace(/(?:\r\n|\r|\n)/g, ''));
    setReport(Parser().parse(htmlString.trim()));
  };

  const onHandleSendReport = async () => {
    try {
      await sendSummaryReport(htmlReport);
    } catch (error) {
      console.log(error);
    }
  };

  const onHandleGetReport = async (job, id) => {
    setLoading(true);
    setJob(jobs.map((elm) => elm.id === job));
    try {
      const result = await getExecutionReport(job, id);

      const chart = generateChart(
        "pie",
        ["Passed", "Failed"],
        [
          percentage(
            result.passedTests,
            result.passedTests + result.failedTests
          ),
          percentage(
            result.failedTests,
            result.passedTests + result.failedTests
          ),
        ],
        result.jobName,
        result.resultType,
        result.passRatio.toFixed(2)
      );

      const report = (
        <div className="card">
          <div>
            <div className="card-row card-header">
              {/* AGENT */}
              <div>
                <div>
                  <b>{`Agent`}</b>
                </div>
                <div>{result.agentName}</div>
              </div>
              {/* TESTS */}
              <div>
                <div>
                  <b>{`Tests`}</b>
                </div>
                <div>{result.passedTests + result.failedTests}</div>
              </div>
              {/* PLATFORM */}
              <div>
                <div>
                  <b>{`Platform`}</b>
                </div>
                <div>{result.platform}</div>
              </div>
            </div>
          </div>
          <div className="card-row">
            {/* CHART */}
            <div>
              <img alt="chart" src={chart} width={420} height={260} />
            </div>
            {/* INFORMATION */}
            <div>
              <div className="card-section">
                <p>
                  <b>Start Time</b>
                </p>
                {moment(result.executionStart).format("MM/DD/YY h:mm A")}
              </div>
              <div className="card-section">
                <p>
                  <b>Job duration</b>
                </p>
                {moment(
                  moment(result.executionEnd).diff(
                    moment(result.executionStart)
                  )
                ).format("00:mm:ss.mss")}
              </div>
            </div>
            {/* Statics */}
            <div>
              <div className="card-stats">
                <div className="stats-icon stats-icon-success"></div>
                <p>{`Passed ( ${percentage(
                  result.passedTests,
                  result.passedTests + result.failedTests
                )}% )`}</p>
              </div>
              <div className="card-stats">
                <div className="stats-icon stats-icon-fail"></div>
                <p>{`Failed ( ${percentage(
                  result.failedTests,
                  result.passedTests + result.failedTests
                )}% )`}</p>
              </div>
            </div>
          </div>
        </div>
      );

      setJob({ ...job, report: report });
      setOpen(true);
      setLoading(false);
    } catch (error) {}
  };

  return (
    <div>
      <div>
        <h4>{`Jobs`}</h4>
      </div>
      <div>
        <Table columns={COLUMNS} rows={jobs} loading={loading} />
        <div>
          <button onClick={onHandleGetSummarizeReport}>
            Get Summarize Report
          </button>
        </div>
        <div>
          <button onClick={onHandleSendReport}>Send Summarize Report</button>
        </div>
        <div
          style={{
            padding: 10,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          {report}
        </div>
      </div>
      <Modal isOpen={open} handleCancel={() => setOpen(false)}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignContent: "center",
          }}
        >
          {job.report}
        </div>
      </Modal>
    </div>
  );
};
