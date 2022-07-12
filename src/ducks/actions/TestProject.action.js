const { API, APISES } = require("../../services/api.service");
const { getClientData } = require("../../util/index");
const { REPORT_MOCK } = require("../../mock/data.mock");

const projectID = "wS38bJoQpUeO5zFg_71UOw";
const executionList = [];
let jobList = [];

const getJobs = async (project = projectID) => {
  const { data } = await API.get(`/projects/${project}/jobs`);

  jobList = data;

  return jobList;
};

const getExecutedJobs = async (job, project = projectID) => {
  const { data } = await API.get(`/projects/${project}/jobs/${job}/reports`);

  return data;
};

const executeJob = async (job) => {
  const { data } = await API.post(`/projects/${projectID}/jobs/${job}/run`, {
    queue: true,
  });

  return data.id;
};

const addExecuteJob = (id) => {
  executionList.push(id);
};

const getExecutionList = () => executionList;

const getExecutionReport = async (job, id, project = projectID) => {
  const { data } = await API.get(
    `/projects/${project}/jobs/${job}/reports/${id}`
  );

  return data;
};

const getSummarizeReport = async () => {
  const clients = getClientData();
  let summarizeReport = {};

  for (let client = 0; client < clients.length; client++) {
    const element = clients[client];

    const jobs = element.jobs;

    for (let index = 0; index < jobs.length; index++) {
      const job = jobs[index];

      const reports = await getExecutedJobs(job, element.project);
      console.log(reports);
      if (reports.length > 0) {
        const report = reports.sort(
          (a, b) => new Date(b.executionEnd) - new Date(a.executionEnd)
        )[0];

        const execution = await getExecutionReport(
          job,
          report.id,
          element.project
        );

        console.log(execution);

        summarizeReport[element.client].jobs = summarizeReport[
          element.client
        ].jobs.map((elm) =>
          elm === job ? { ...elm, report: execution } : elm
        );
      }
    }
  }

  return summarizeReport;
};

const sendSummaryReport = async (report) => {
  console.log(report);
  try {
    const { data } = await APISES.post("mail/send", { message: report });

    console.log(data);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getJobs,
  executeJob,
  addExecuteJob,
  getExecutionList,
  getExecutionReport,
  getExecutedJobs,
  getSummarizeReport,
  sendSummaryReport,
};
