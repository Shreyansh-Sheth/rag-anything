import { Dataset } from "@/api/dataset";
import {
  Modal,
  Container,
  Table,
  TableThead,
  TableTr,
  TableTh,
  TableTbody,
  TableTd,
  Badge,
} from "@mantine/core";

export const FilesModal = ({
  open,
  setOpen,
  dataset,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  dataset: Dataset;
}) => {
  return (
    <Modal
      size="xl"
      opened={open}
      onClose={() => {
        setOpen(false);
      }}
      title="Dataset Files"
    >
      <Container>
        <Table>
          <TableThead>
            <TableTr>
              <TableTh>File Name</TableTh>
              <TableTh>Indexing Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {dataset?.files?.map((file) => (
              <TableTr key={file.name + file?._id}>
                <TableTd
                  maw={200}
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </TableTd>
                <TableTd>
                  {file.indexingStatus === "PENDING" ? (
                    <Badge color="blue">PENDING</Badge>
                  ) : file.indexingStatus === "COMPLETED" ? (
                    <Badge color="green">COMPLETED</Badge>
                  ) : (
                    <Badge color="red">FAILED</Badge>
                  )}
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </Container>
    </Modal>
  );
};
