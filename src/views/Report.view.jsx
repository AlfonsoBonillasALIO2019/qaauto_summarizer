import React from "react";
import {
  getExecutionReport,
  getExecutedJobs,
  getSummarizeReport,
  sendSummaryReport,
  getJob,
  executeJob,
} from "../ducks/actions/TestProject.action";
import { Table } from "../components/table";
import { CustomModal as Modal } from "../components/modal";
import { generateChart } from "../ducks/actions/QuickChart.action";
import { percentage, getClientData } from "../util";
import moment from "moment";
import { AssessmentOutlined, PlayArrowRounded } from "@mui/icons-material";
import {
  Snackbar,
  Alert as MuiAlert,
  Button,
  CircularProgress,
} from "@mui/material";
// import { Parser } from "html-to-react";
import "./Style.css";

const Alert = React.forwardRef((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SnackBarPosition = {
  vertical: "top",
  horizontal: "right",
};

export const ReportView = () => {
  const [jobs, setJobs] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loadingRequest, setLoadingRequest] = React.useState(false);
  const [job, setJob] = React.useState({});
  const [htmlReport, setHTMLReport] = React.useState("");
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [openFailed, setOpenFailed] = React.useState(false);
  const [error, setError] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  const onHandleCloseSuccess = (event, reason) => {
    if (reason === "clickaway") return;

    setOpenSuccess(false);
  };

  const onHandleCloseFailed = (event, reason) => {
    if (reason === "clickaway") return;

    setOpenFailed(false);
  };

  const COLUMNS = [
    {
      filed: "client",
      headerName: "Client",
      width: 200,
      align: "left",
      renderCell: (params) => <b>{params.row.client}</b>,
    },
    {
      field: "name",
      headerName: "Job",
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
      field: "",
      headerName: "Execute",
      width: 200,
      align: "left",
      renderCell: (params) => {
        return (
          <PlayArrowRounded
            key={params.row.id}
            style={{ cursor: "pointer" }}
            onClick={() =>
              onHandleExecuteJob(params.row.id, params.row.project)
            }
          />
        );
      },
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

  const onHandleExecuteJob = async (job, project) => {
    try {
      const result = await executeJob(job, project);

      setJobs((prev) =>
        prev.map((elm) =>
          elm.id === job ? { ...elm, executeID: result } : elm
        )
      );

      setSuccessMessage(
        "The job has been executed, please wait to get the report!"
      );
      setOpenSuccess(true);
    } catch (error) {
      setError(error.message);
      setOpenFailed(true);
    }
  };

  const onHandleGetJobs = React.useCallback(async () => {
    setLoading(true);
    const result = getClientData();
    const auxArray = [];

    for (const key in result) {
      if (Object.hasOwnProperty.call(result, key)) {
        const { jobs, ...element } = result[key];

        for (let index = 0; index < jobs.length; index++) {
          const elm = jobs[index];
          const job = await getJob(elm, element.project);
          const executions = await getExecutedJobs(job.id, element.project);
          if (executions.length > 0) {
            const lastExecuted = executions.sort(
              (a, b) => new Date(b.executionEnd) - new Date(a.executionEnd)
            )[0];

            auxArray.push({
              ...element,
              ...job,
              executeID: lastExecuted.id,
              report: "",
              execute: "",
            });
          } else {
            auxArray.push({ ...element, ...job, report: "", execute: "" });
          }
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

    let htmlString =
      '<table><thead style="background-color: lightblue;" ><tr><th>Client Name</th><th>Product</th><th><div>Test Cases</div><div style="display: flex; flex-direction: row; justify-content: space-around; align-items: center;"><div style="padding: 5px; background-color: #00e28f;" >Passed</div><div style="padding: 5px; background-color: #fd6460;" >Failed</div><div style="padding: 5px; background-color: darkgray;" >Status</div></div></th></tr></thead><tbody>';

    for (const key in result) {
      if (Object.hasOwnProperty.call(result, key)) {
        const client = result[key];
        let auxString1 =
          '<tr><td style="border: 1px solid;" >' +
          key +
          '</td><td style="border: 1px solid;" ><table style="width: 100%;" ><tbody>';
        for (let index = 0; index < client.jobs.length; index++) {
          const elm = client.jobs[index];

          if (elm.report)
            auxString1 +=
              '<tr><td><a target="_blank" href=\'' +
              elm.report.reportUrl +
              "' >" +
              elm.name +
              "</a></td></tr>";
          else auxString1 += "<tr><td>" + elm.name + "</td></tr>";

          if (index === client.jobs.length - 1) {
            auxString1 += "</tbody></table></td>";
            htmlString += auxString1;
          }
        }

        let auxString2 =
          '<td style="border: 1px solid;" ><table style="width: 100%;" ><tbody>';
        for (let index = 0; index < client.jobs.length; index++) {
          const elm = client.jobs[index];

          auxString2 += `<tr>
                          ${
                            !elm.report
                              ? '<td style="width: 30%;" >0</td><td style="width: 30%;" >0</td><td style="width: 30%;" >N/A</td>'
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

        if (Object.keys(result)[Object.keys(result).length - 1] === key)
          htmlString += "</tbody></table>";
      }
    }
    setHTMLReport(htmlString.replace(/(?:\r\n|\r|\n)/g, ""));
  };

  const onHandleSendReport = async () => {
    setLoadingRequest(true);
    await onHandleGetSummarizeReport();
    sendSummaryReport(htmlReport)
    .then(() => {
      setSuccessMessage(
        "The summary report has been sent it, please check your inbox."
      );
      setOpenSuccess(true);
      setLoadingRequest(false);
    })
    .catch(() => {
      setError("The summary report could not be send it, try again later.");
      setOpenFailed(true);
      setLoadingRequest(false);
    });
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
        <div style={{ display: "flex", padding: 30 }}>
          <Button variant="outlined" onClick={onHandleSendReport}>
            {loadingRequest ? (
              <CircularProgress size={14} />
            ) : (
              "Send Summarize Report"
            )}
          </Button>
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
      <Snackbar
        anchorOrigin={SnackBarPosition}
        open={openSuccess}
        autoHideDuration={4000}
        onClose={onHandleCloseSuccess}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={SnackBarPosition}
        open={openFailed}
        autoHideDuration={4000}
        onClose={onHandleCloseFailed}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};
