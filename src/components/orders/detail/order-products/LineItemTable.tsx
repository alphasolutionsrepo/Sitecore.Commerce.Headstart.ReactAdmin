import {
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  HStack,
  VStack,
  Text,
  Hide,
  Stack,
  Flex
} from "@chakra-ui/react"
import {ILineItem} from "types/ordercloud/ILineItem"
import {ProductThumbnail} from "./ProductThumbnail"
import {priceHelper} from "utils"

interface LineItemTableProps {
  lineItems: ILineItem[]
}
export function LineItemTable({lineItems}: LineItemTableProps) {
  return (
    <TableContainer>
      <Table>
        <Thead>
          <Tr>
            <Th>Details</Th>
            <Hide below="sm">
              <Th>Quantity</Th>
            </Hide>
            <Hide below="md">
              <Th>Unit Price</Th>
            </Hide>
            <Hide below="sm">
              <Th>Total</Th>
            </Hide>
          </Tr>
        </Thead>
        <Tbody>
          {lineItems.map((lineItem) => {
            return (
              <Tr key={lineItem.ID}>
                <Td>
                  <Stack direction={["row", "column", "row"]} alignItems={["stretch", "start", "end"]}>
                    <ProductThumbnail imageProps={{boxSize: [125, 75]}} product={lineItem.Product} />
                    <VStack justifyContent="space-between">
                      <Flex flexDirection="column">
                        <Text fontSize="sm">{lineItem.Product.Name}</Text>
                        <Text fontSize="xs" color="gray.400">
                          SKU: {lineItem.Product.ID}
                        </Text>
                      </Flex>
                      <Hide above="sm">
                        <HStack width="full" justifyContent="space-between">
                          <Text fontSize="xs">Qty: 2</Text>
                          <Text fontSize="xs">{priceHelper.formatPrice(lineItem.LineTotal)}</Text>
                        </HStack>
                      </Hide>
                    </VStack>
                  </Stack>
                </Td>
                <Hide below="sm">
                  <Td>{lineItem.Quantity}</Td>
                </Hide>
                <Hide below="md">
                  <Td>{priceHelper.formatPrice(lineItem.UnitPrice)}</Td>
                </Hide>
                <Hide below="sm">
                  <Td>{priceHelper.formatPrice(lineItem.LineTotal)}</Td>
                </Hide>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </TableContainer>
  )
}
