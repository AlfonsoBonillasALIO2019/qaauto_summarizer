const { API, APISES } = require("../../services/api.service");
const { getClientData } = require("../../util/index");
const { REPORT_MOCK } = require("../../mock/data.mock");

const projectID = "wS38bJoQpUeO5zFg_71UOw";
const executionList = [];
let jobList = [];

export const getJobs = async (project = projectID) => {
  const { data } = await API.get(`/projects/${project}/jobs`);

  jobList = data;

  return jobList;
};

export const getJob = async (job, project = projectID) => {
  const { data } = await API.get(`/projects/${project}/jobs/${job}`);

  return data;
};

export const getExecutedJobs = async (job, project = projectID) => {
  const { data } = await API.get(`/projects/${project}/jobs/${job}/reports`);

  return data;
};

export const executeJob = async (job, project = projectID) => {
  try {
    const { data } = await API.post(`/projects/${project}/jobs/${job}/run`, {
      queue: true,
    });

    return data.id;
  } catch (error) {
    throw new Error(error.response.headers.message);
  }
};

export const addExecuteJob = (id) => {
  executionList.push(id);
};

export const getExecutionList = () => executionList;

export const getExecutionReport = async (job, id, project = projectID) => {
  const { data } = await API.get(
    `/projects/${project}/jobs/${job}/reports/${id}`
  );

  return data;
};

export const getSummarizeReport = async () => {
  const clients = getClientData();
  let summarizeReport = {};

  for (let client = 0; client < clients.length; client++) {
    const element = clients[client];

    const jobs = element.jobs;

    for (let index = 0; index < jobs.length; index++) {
      const job = jobs[index];
      const jobInfo = await getJob(job, element.project);

      if (!summarizeReport[element.client])
        summarizeReport[element.client] = {
          jobs: [{ ...jobInfo }],
        };
      else
        summarizeReport[element.client].jobs = [
          ...summarizeReport[element.client].jobs,
          { ...jobInfo },
        ];

      const reports = await getExecutedJobs(job, element.project);

      if (reports.length > 0) {
        const report = reports.sort(
          (a, b) => new Date(b.executionEnd) - new Date(a.executionEnd)
        )[0];

        const execution = await getExecutionReport(
          job,
          report.id,
          element.project
        );

        summarizeReport[element.client].jobs = summarizeReport[
          element.client
        ].jobs.map((elm) =>
          elm.id === job ? { ...jobInfo, report: execution } : elm
        );
      }
    }
  }

  return summarizeReport;
};

export const sendSummaryReport = async (report) => {
  try {
    const { data } = await APISES.post("/default/PP-QA_Summarizer", {
      message: report,
    });

    return;
  } catch (error) {
    throw new Error();
  }
};
