"use client";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Container,
  Divider,
  FileButton,
  Paper,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  TextInput,
  Title,
} from "@mantine/core";
import { Group, Text, rem } from "@mantine/core";
import {
  IconUpload,
  IconPhoto,
  IconX,
  IconTrash,
  IconFileUpload,
  IconArrowLeft,
} from "@tabler/icons-react";
import byteSize from "byte-size";

import { useForm, zodResolver } from "@mantine/form";
import { AcceptableMimeTypes, NewChatValidation } from "@/helpers/validation";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
export default function NewChat() {
  const {
    getInputProps,
    getValues,
    insertListItem,
    removeListItem,
    onSubmit,
    errors,
  } = useForm<z.infer<typeof NewChatValidation>>({
    initialValues: {
      files: [],
      name: "",
    },
    validate: zodResolver(NewChatValidation),
  });
  const auth = useAuth();

  const addFile = (files?: File[]) => {
    if (!files || files.length === 0) {
      return;
    }
    files.forEach((file, idx) => {
      insertListItem("files", file);
    });
  };
  const { push } = useRouter();
  const SubmitFiles = onSubmit(async (data) => {
    const Form = new FormData();
    Form.append("name", data.name);
    data.files.forEach((file, idx) => {
      // Form.append("files[" + idx + "]", file);
      Form.append("files", file);
    });
    fetch("http://localhost:3001/dataset", {
      method: "POST",
      body: Form,
      headers: {
        Authorization: "Bearer " + (await auth.getToken()),
      },
    });
    push("/chat");
  });
  console.log(errors);
  return (
    <Container>
      <Stack>
        <Group>
          <ActionIcon onClick={() => push("/chat")} size="sm">
            <IconArrowLeft />
          </ActionIcon>
          <Title order={1}>Create New Dataset</Title>
        </Group>
        <Divider />
        <form onSubmit={SubmitFiles}>
          <Stack>
            <TextInput
              {...getInputProps("name")}
              placeholder="Chat Session Name"
            />
            <Paper p={10} withBorder>
              <Group justify="end">
                <Stack gap={0}>
                  <FileButton
                    multiple
                    {...getInputProps("files")}
                    onChange={addFile}
                    accept={AcceptableMimeTypes.join(",")}
                  >
                    {(props) => (
                      <Button
                        {...props}
                        leftSection={<IconFileUpload size={20} />}
                      >
                        Upload Files
                      </Button>
                    )}
                  </FileButton>
                  <Text size="sm" color="red">
                    {errors.files}
                  </Text>
                </Stack>
              </Group>
              <Table>
                <TableThead>
                  <TableTr>
                    <TableTh>File Name</TableTh>
                    <TableTh>Size</TableTh>
                    <TableTh>Actions</TableTh>
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {getValues().files.map((file, index) => (
                    <TableTr key={file?.name}>
                      <TableTd>{file?.name}</TableTd>
                      <TableTd>{byteSize(file.size).toString()}</TableTd>
                      <TableTd>
                        <Button
                          onClick={() => {
                            removeListItem("files", index);
                          }}
                          variant="transparent"
                          size="xs"
                          color="red"
                        >
                          <IconTrash size="20" />
                        </Button>
                      </TableTd>
                    </TableTr>
                  ))}
                </TableTbody>
              </Table>
              {getValues().files.length === 0 && (
                <Center my={10}>
                  <Text size="sm">No files uploaded</Text>
                </Center>
              )}
            </Paper>
            <Button type="submit">Create New Chat</Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
