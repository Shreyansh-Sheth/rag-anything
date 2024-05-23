"use client";
import { useAskQuestionMutation, useGetChat } from "@/api/chat";
import { useGetDatasetQuery } from "@/api/dataset";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Accordion,
  ActionIcon,
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Avatar,
  Box,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconArrowBack,
  IconArrowLeft,
  IconMenu,
  IconPdf,
  IconSend2,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Goblin_One } from "next/font/google";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FilesModal } from "../filesModal";
const Chats = [
  {
    role: "user",
    text: "Hello",
  },
  {
    role: "bot",
    text: "Hi, how can I help you?",
  },
];
const list100 = new Array(100)
  .fill(0)
  .map((e) => Chats)
  .flat();

export default function ChatPage({ params }: { params: { id: string } }) {
  const id = params.id;
  console.log(id);
  const user = useUser();
  const { mutate } = useAskQuestionMutation();
  const { getInputProps, onSubmit, onReset, reset } = useForm({
    initialValues: {
      question: "",
    },
  });
  const { data: datasetData, isLoading: datasetLoading } = useGetDatasetQuery({
    datasetId: id,
  });
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState<string>("");
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const { isLoading, data, refetch } = useGetChat({ datasetId: id });
  const queryClient = useQueryClient();
  const scrollingContainerRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const submit = onSubmit(async (value) => {
    reset();
    setIsAnswerLoading(true);
    queryClient.setQueryData(["chat", id], (e: typeof data) => {
      if (!e)
        return [
          {
            data: value.question,
            role: "user",
            _id: Math.random().toString(),
          },
        ];

      return [
        ...e,
        {
          data: value.question,
          role: "user",
          _id: Math.random().toString(),
        },
      ];
    });
    scrollingContainerRef.current?.scrollTo({
      top: scrollingContainerRef.current?.scrollHeight,
      behavior: "smooth",
    });
    try {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        body: JSON.stringify({
          datasetId: id,
          question: value.question,
        }),
        headers: {
          Authorization: "Bearer " + (await auth.getToken()),
        },
      });
      let decoder = new TextDecoder();
      let reader = res.body?.getReader();
      if (!reader) return;
      reader.read().then(function processResult(result): any {
        if (result.done) {
          refetch().then(() => {
            setStreamingOutput("");
          });
          return;
        }
        setIsAnswerLoading(false);
        const out = decoder.decode(result.value, { stream: true });
        setStreamingOutput((e) => e + out);
        scrollingContainerRef.current?.scrollTo({
          top: scrollingContainerRef.current?.scrollHeight,
          behavior: "smooth",
        });
        return reader.read().then(processResult);
      });
    } catch {
      setIsAnswerLoading(false);
    }
  });

  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (ref.current) {
      const height = ref.current.getBoundingClientRect().top;

      setHeight(height);
    }
  }, [ref]);

  if (datasetLoading || isLoading) {
    return (
      <Center>
        <Loader />;
      </Center>
    );
  }

  return (
    <AppShell>
      <AppShellMain
        p={0}
        ref={ref}
        mih={`calc(95vh - ${height}px)`}
        pos={"relative"}
      >
        <Paper
          withBorder
          shadow="md"
          style={{ height: "50px", display: "flex", justifyItems: "center" }}
        >
          <Container my="auto">
            <Group gap={125} my="auto" justify="space-between">
              <ActionIcon component={Link} href={"/chat"}>
                <IconArrowLeft />
              </ActionIcon>
              <Title order={5}>{datasetData?.name}</Title>
              <ActionIcon
                onClick={() => {
                  setFilesModalOpen(true);
                }}
                variant="light"
                size="xs"
              >
                <IconMenu />
              </ActionIcon>
              <FilesModal
                open={filesModalOpen}
                setOpen={setFilesModalOpen}
                dataset={datasetData!}
              />
            </Group>
          </Container>
        </Paper>
        <Paper
          mah={`calc(85vh - ${height}px - 50px )`}
          ref={scrollingContainerRef}
          style={{
            overflowY: "scroll",
          }}
        >
          <Container>
            <Stack>
              {data &&
                data?.map((e) => (
                  <Group
                    key={e._id}
                    justify={e.role === "bot" ? "left" : "right"}
                  >
                    <Paper
                      style={(theme) => ({
                        padding: 10,
                        maxWidth: "60%",
                        backgroundColor: theme.colors.gray[2],
                        margin: 10,
                      })}
                    >
                      <Flex direction={"column"}>
                        <Text miw={150} c="gray" size="xs">
                          {e.role === "bot" ? "Bot" : "You"}
                        </Text>
                        <Text m={2}>{e.data}</Text>
                        <Paper>
                          {e?.content && e?.content?.length > 0 && (
                            <Accordion>
                              {e?.content.map((content, idx) => (
                                <Accordion.Item
                                  key={idx}
                                  value={content.fileName + idx + e._id}
                                >
                                  <Accordion.Control
                                    icon={<IconPdf color="red" size={16} />}
                                  >
                                    <Text size="xs">{content.fileName}</Text>
                                  </Accordion.Control>
                                  <Accordion.Panel>
                                    <Text size="xs"> {content.text} </Text>
                                  </Accordion.Panel>
                                </Accordion.Item>
                              ))}
                            </Accordion>
                          )}
                        </Paper>
                      </Flex>
                    </Paper>
                  </Group>
                ))}
              {isAnswerLoading && (
                <Group justify="left" miw={150}>
                  <Paper
                    style={(theme) => ({
                      padding: 10,
                      maxWidth: "60%",
                      backgroundColor: theme.colors.gray[2],
                      margin: 10,
                    })}
                  >
                    <Flex direction={"column"}>
                      <Text>Bot: </Text>
                      <Skeleton h={150} w={150} />
                    </Flex>
                  </Paper>
                </Group>
              )}
              {streamingOutput && (
                <Group justify="left" miw={150}>
                  <Paper
                    style={(theme) => ({
                      padding: 10,
                      maxWidth: "60%",
                      backgroundColor: theme.colors.gray[2],
                      margin: 10,
                    })}
                  >
                    <Flex direction={"column"}>
                      <Text>Bot: </Text>
                      <Text m={2}>{streamingOutput}</Text>
                    </Flex>
                  </Paper>
                </Group>
              )}
            </Stack>
          </Container>
        </Paper>

        <Paper
          p={10}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            zIndex: 100,
            width: "100%",
          }}
        >
          <form onSubmit={submit}>
            <Container>
              <Flex justify="center" gap={10} w={"100%"}>
                <Textarea
                  size="lg"
                  style={{
                    flexGrow: 1,
                  }}
                  {...getInputProps("question")}
                  placeholder="Ask Me Anything"
                  rightSection={
                    <ActionIcon
                      type="submit"
                      disabled={!getInputProps("question").value}
                      variant="transparent"
                      my="auto"
                    >
                      <IconSend2 />
                    </ActionIcon>
                  }
                />
              </Flex>
            </Container>
          </form>
        </Paper>
      </AppShellMain>
    </AppShell>
  );
}
