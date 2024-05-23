"use client";

import { Dataset, useListDatasetQuery } from "@/api/dataset";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  CardSection,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
} from "@mantine/core";
import { IconMenu2 } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { FilesModal } from "./filesModal";

export default function Chat() {
  const { data: datasetList, isLoading, isError } = useListDatasetQuery();

  if (isError) {
    return <div>Error</div>;
  }

  if (isLoading || !datasetList) {
    return <Loader />;
  }

  return (
    <Stack>
      <Group justify="end">
        <Button component={Link} href={"/chat/new"}>
          Create new dataset
        </Button>
      </Group>
      <Divider />
      <Container size={"xl"}>
        <Stack>
          <Title order={2}>Datasets</Title>
          <Divider />
          <Group>
            {datasetList &&
              datasetList?.map((dataset) => (
                <DatasetItem {...dataset} key={dataset._id} />
              ))}
          </Group>
        </Stack>
      </Container>
    </Stack>
  );
}

export const DatasetItem = (dataset: Dataset) => {
  const [open, setOpen] = useState(false);
  return (
    <Card key={dataset._id} withBorder w={400} shadow="sm" padding="xl">
      <CardSection p="md">
        <Group justify="end">
          <ActionIcon
            onClick={() => {
              setOpen(true);
            }}
            size={"sm"}
            variant="subtle"
          >
            <IconMenu2 />
          </ActionIcon>
          <FilesModal open={open} setOpen={setOpen} dataset={dataset} />
        </Group>
      </CardSection>
      <Divider />
      <Box h={100} my={2}>
        <Title order={3}>{dataset.name}</Title>
        <Text c="gray">Files: {dataset.files.length}</Text>
      </Box>
      <Divider />
      <CardSection p={"md"}>
        <Group justify="end">
          <Button component={Link} href={`/chat/${dataset._id}`}>
            Start Chat
          </Button>
        </Group>
      </CardSection>
    </Card>
  );
};
