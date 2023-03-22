import * as Yup from "yup"
import {Box, Button, ButtonGroup, Flex, Stack} from "@chakra-ui/react"
import {InputControl} from "components/react-hook-form"
import Card from "../card/Card"
import {Address, AdminAddresses} from "ordercloud-javascript-sdk"
import {useRouter} from "hooks/useRouter"
import {useCreateUpdateForm} from "hooks/useCreateUpdateForm"
import {pick} from "lodash"
import {IAdminAddress} from "types/ordercloud/IAdminAddress"
import {useForm} from "react-hook-form"
import {yupResolver} from "@hookform/resolvers/yup"

export {CreateUpdateForm}
interface CreateUpdateFormProps {
  address?: Address
}
function CreateUpdateForm({address}: CreateUpdateFormProps) {
  let router = useRouter()
  const formShape = {
    AddressName: Yup.string().max(100),
    CompanyName: Yup.string().max(100),
    FirstName: Yup.string().max(100),
    LastName: Yup.string().max(100),
    Street1: Yup.string().max(100).required(),
    Street2: Yup.string().max(100),
    City: Yup.string().max(100).required(),
    State: Yup.string().max(100).required(),
    Zip: Yup.string().max(100).required(),
    Country: Yup.string().max(2).min(2).required(),
    Phone: Yup.string().max(100)
  }

  const {successToast, validationSchema, defaultValues, onSubmit} = useCreateUpdateForm<Address>(
    address,
    formShape,
    createAddress,
    updateAddress
  )

  const {
    handleSubmit,
    control,
    formState: {isSubmitting, isValid, isDirty},
    reset
  } = useForm({resolver: yupResolver(validationSchema), defaultValues})

  async function createAddress(fields: Address) {
    await AdminAddresses.Create<IAdminAddress>(fields)
    successToast({
      description: "Address created successfully."
    })
    router.back()
  }

  async function updateAddress(fields: Address) {
    const formFields = Object.keys(formShape)
    await AdminAddresses.Patch<IAdminAddress>(fields.ID, pick(fields, formFields))
    successToast({
      description: "Address updated successfully"
    })
    router.back()
  }

  return (
    <Card variant="primaryCard">
      <Flex flexDirection="column" p="10">
        <Box as="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={5}>
            <InputControl name="AddressName" label="Address Name" control={control} />
            <InputControl name="CompanyName" label="Company Name" control={control} />
            <InputControl name="FirstName" label="First Name" control={control} />
            <InputControl name="LastName" label="Last Name" control={control} />
            <InputControl name="Street1" label="Street 1" control={control} isRequired />
            <InputControl name="Street2" label="Street 2" control={control} />
            <InputControl name="City" label="City" control={control} isRequired />
            <InputControl name="State" label="State" control={control} isRequired />
            <InputControl name="Zip" label="Zip" control={control} isRequired />
            <InputControl name="Country" label="Country" control={control} isRequired />
            <InputControl name="Phone" label="Phone" control={control} />
            <ButtonGroup>
              <Button variant="primaryButton" type="submit" isLoading={isSubmitting} isDisabled={!isValid || !isDirty}>
                Save
              </Button>
              <Button onClick={reset} type="reset" variant="secondaryButton" isLoading={isSubmitting}>
                Reset
              </Button>
              <Button onClick={() => router.back()} variant="secondaryButton" isLoading={isSubmitting}>
                Cancel
              </Button>
            </ButtonGroup>
          </Stack>
        </Box>
      </Flex>
    </Card>
  )
}
