import React, { useEffect, useState, Fragment } from "react";
import styled from "styled-components";
import { useMutation } from "react-apollo-hooks";
import { space, color } from "styled-system";
import { Tooltip } from "react-tippy";
import SET_WATCH_MODE from "./set-watch-mode.gql";
import { Workspace } from "../../server/api/workspace/workspace";
import { transform, filterFailure } from "./transformer";
import Summary from "./summary";
import { Summary as SummaryType } from "../../server/api/workspace/summary";
import RUN from "./run.gql";
import {
  Play,
  Eye,
  Search,
  RefreshCw,
  ZapOff,
  StopCircle
} from "react-feather";
import Button from "../components/button";
import { RunnerStatus } from "../../server/api/runner/status";
import Tree from "./tree";
import Logo from "./logo";

const Container = styled.div<any>`
  ${space};
  ${color};
  height: 100vh;
`;

const ActionsPanel = styled.div<any>`
  ${space}
  display: flex;
  justify-content: space-between;
`;

const RightActionPanel = styled.div`
  display: flex;
`;

const FileHeader = styled.div<any>`
  ${space}
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
`;

const FilesHeader = styled.div`
  font-weight: 400;
  font-size: 11px;
`;

const RightFilesAction = styled.div`
  display: flex;
`;

interface Props {
  selectedFile: string;
  workspace: Workspace;
  summary: SummaryType | undefined;
  runnerStatus?: RunnerStatus;
  onSelectedFileChange: (path: string) => void;
  onSearchOpen: () => void;
  onRefreshFiles: () => void;
  onStop: () => void;
}

export default function TestExplorer({
  selectedFile,
  workspace,
  onSelectedFileChange,
  summary,
  runnerStatus,
  onSearchOpen,
  onRefreshFiles,
  onStop
}: Props) {
  const failedItems = (summary && summary.failedTests) || [];
  const executingItems = (summary && summary.executingTests) || [];
  const passingTests = (summary && summary.passingTests) || [];

  const run = useMutation(RUN);

  const [collapsedItems, setCollapsedItems] = useState({});
  const handleFileToggle = (path: string, isCollapsed: boolean) => {
    setCollapsedItems({
      ...collapsedItems,
      [path]: isCollapsed
    });
  };

  const [showFailedTests, setShowFailedTests] = useState(false);

  const items = workspace.files;
  const root = items[0];
  let files = transform(
    root as any,
    executingItems,
    failedItems,
    passingTests,
    collapsedItems,
    showFailedTests,
    items
  );

  if (showFailedTests) {
    files = filterFailure(files);
  }

  const handleFileSelection = (path: string) => {
    onSelectedFileChange(path);
  };

  const setWatchMode = useMutation(SET_WATCH_MODE);
  const handleSetWatchModel = (watch: boolean) => {
    setWatchMode({
      variables: {
        watch
      }
    });
  };

  const isRunning = runnerStatus && runnerStatus.running;

  return (
    <Container p={4} bg="veryDark" color="text">
      <Logo />
      <ActionsPanel mb={4}>
        <Tooltip title="Run all tests" position="bottom" size="small">
          <Button
            icon={isRunning ? <StopCircle size={15} /> : <Play size={15} />}
            size="sm"
            onClick={() => {
              if (isRunning) {
                onStop();
              } else {
                run();
              }
            }}
          >
            {isRunning ? "Stop" : "Run tests"}
          </Button>
        </Tooltip>
        <RightActionPanel>
          <Tooltip title="Toggle watch mode" position="bottom" size="small">
            <Button
              icon={<Eye size={14} />}
              minimal
              onClick={() => {
                if (runnerStatus) {
                  handleSetWatchModel(!runnerStatus.watching);
                }
              }}
            >
              {runnerStatus && runnerStatus.watching
                ? "Stop Watching"
                : "Watch"}
            </Button>
          </Tooltip>
          <Tooltip title="Search test files" position="bottom" size="small">
            <Button
              minimal
              onClick={() => {
                onSearchOpen();
              }}
            >
              <Search size={14} />
            </Button>
          </Tooltip>
        </RightActionPanel>
      </ActionsPanel>
      <Summary summary={summary} />
      <FileHeader mt={4} mb={3}>
        <FilesHeader>Tests</FilesHeader>
        <RightFilesAction>
          <Tooltip title="Refresh files" position="bottom" size="small">
            <Button
              size="sm"
              minimal
              onClick={() => {
                onRefreshFiles();
              }}
            >
              <RefreshCw size={10} />
            </Button>
          </Tooltip>
          {summary && summary.failedTests && summary.failedTests.length > 0 && (
            <Tooltip
              title="Show only failed tests"
              position="bottom"
              size="small"
            >
              <Button
                size="sm"
                minimal
                onClick={() => {
                  setShowFailedTests(!showFailedTests);
                }}
              >
                <ZapOff size={10} />
              </Button>
            </Tooltip>
          )}
        </RightFilesAction>
      </FileHeader>
      <Tree
        results={files}
        selectedFile={selectedFile}
        onFileSelection={handleFileSelection}
        onToggle={handleFileToggle}
      />
    </Container>
  );
}
