import * as React from "react";

import { Loading } from "@renproject/react-components";

import { _catchInteractionErr_ } from "../../lib/errors";
import { connect, ConnectedProps } from "../../state/connect";
import { isERC20, isEthereumBased } from "../../state/generalTypes";
import {
    CommitmentType, ShiftInStatus, ShiftOutEvent, ShiftOutStatus,
} from "../../state/persistentContainer";
import { SDKContainer } from "../../state/sdkContainer";
import { UIContainer } from "../../state/uiContainer";
import { DepositReceived } from "../views/order-popup/DepositReceived";
import { ShowDepositAddress } from "../views/order-popup/ShowDepositAddress";
import { SubmitToEthereum } from "../views/order-popup/SubmitToEthereum";
import { TokenAllowance } from "../views/order-popup/TokenAllowance";
import { Popup } from "../views/Popup";

interface Props extends ConnectedProps<[UIContainer, SDKContainer]> {
    orderID: string;
}

/**
 * OpeningOrder is a visual component for allowing users to open new orders
 */
export const OpeningOrder = connect<Props & ConnectedProps<[UIContainer, SDKContainer]>>([UIContainer, SDKContainer])(
    ({ orderID, containers: [uiContainer, sdkContainer] }) => {

        // tslint:disable-next-line: prefer-const
        let [returned, setReturned] = React.useState(false);
        const [ERC20Approved, setERC20Approved] = React.useState(false);

        const onDone = React.useCallback(async () => {
            if (returned) {
                return;
            }
            returned = true;
            setReturned(true);
            uiContainer.resetTrade().catch(error => _catchInteractionErr_(error, "Error in OpeningOrder: resetTrade"));
        }, [returned, setReturned, uiContainer]);

        const hide = React.useCallback(async () => {
            await uiContainer.handleOrder(null);
        }, [uiContainer]);

        const { sdkRenVM } = sdkContainer.state;

        if (!sdkRenVM) {
            return <Popup>
                <div className="popup--body popup--loading">
                    <Loading />
                    <span>Loading</span>
                </div>
            </Popup>;
        }

        const order = sdkContainer.order(orderID);
        if (!order) {
            throw new Error("Order not set");
        }

        const shiftIn = () => {
            switch (order.status) {
                case ShiftInStatus.Committed:
                    // Show the deposit address and wait for a deposit
                    return <ShowDepositAddress
                        orderID={orderID}
                        order={order}
                        generateAddress={sdkContainer.generateAddress}
                        token={order.orderInputs.srcToken}
                        amount={order.orderInputs.srcAmount}
                        waitForDeposit={sdkContainer.waitForDeposits}
                        cancel={uiContainer.resetTrade}
                    />;
                case ShiftInStatus.Deposited:
                case ShiftInStatus.SubmittedToRenVM:
                    return <DepositReceived renVMStatus={order.renVMStatus} messageID={order.messageID} orderID={orderID} submitDeposit={sdkContainer.submitMintToRenVM} hide={hide} />;
                case ShiftInStatus.ReturnedFromRenVM:
                case ShiftInStatus.SubmittedToEthereum:
                    return <SubmitToEthereum order={order} txHash={order.outTx} token={order.orderInputs.dstToken} orderID={orderID} submit={sdkContainer.submitMintToEthereum} hide={hide} />;
                case ShiftInStatus.RefundedOnEthereum:
                case ShiftInStatus.ConfirmedOnEthereum:
                    onDone().catch(error => _catchInteractionErr_(error, "Error in OpeningOrder: shiftIn.onDone"));
                    return <></>;
            }
            _catchInteractionErr_(new Error(`Unknown status in ShiftIn: ${order.status}`), "Error in OpeningOrder: shiftIn");
            return <></>;
        };

        const shiftOut = () => {
            const { messageID, commitment, renVMStatus } = order as ShiftOutEvent;

            switch (order.status) {
                case ShiftOutStatus.Committed:
                    const submit = async (submitOrderID: string) => {
                        await sdkContainer.approveTokenTransfer(submitOrderID);
                        setERC20Approved(true);
                    };
                    if (isERC20(order.orderInputs.srcToken) && !ERC20Approved) {
                        return <TokenAllowance token={order.orderInputs.srcToken} amount={order.orderInputs.srcAmount} orderID={orderID} submit={submit} commitment={commitment} hide={hide} />;
                    }
                    return <SubmitToEthereum order={order} txHash={order.inTx} token={order.orderInputs.dstToken} orderID={orderID} submit={sdkContainer.submitBurnToEthereum} hide={hide} />;
                case ShiftOutStatus.SubmittedToEthereum:
                    // Submit the trade to Ethereum
                    return <SubmitToEthereum order={order} txHash={order.inTx} token={order.orderInputs.dstToken} orderID={orderID} submit={sdkContainer.submitBurnToEthereum} hide={hide} />;
                case ShiftOutStatus.ConfirmedOnEthereum:
                case ShiftOutStatus.SubmittedToRenVM:
                    return <DepositReceived renVMStatus={renVMStatus} messageID={messageID} orderID={orderID} submitDeposit={sdkContainer.submitBurnToRenVM} hide={hide} />;
                case ShiftOutStatus.RefundedOnEthereum:
                case ShiftOutStatus.ReturnedFromRenVM:
                    onDone().catch(error => _catchInteractionErr_(error, "Error in OpeningOrder: shiftOut.onDone"));
                    return <></>;
            }
            _catchInteractionErr_(new Error(`Unknown status in ShiftOut: ${order.status}`), "Error in OpeningOrder: shiftOut");
            return <></>;
        };

        if (!isEthereumBased(order.orderInputs.srcToken) && isEthereumBased(order.orderInputs.dstToken) && (order.commitment.type !== CommitmentType.RemoveLiquidity)) {
            return shiftIn();
        } else if ((order.commitment.type === CommitmentType.RemoveLiquidity) || (isEthereumBased(order.orderInputs.srcToken) && !isEthereumBased(order.orderInputs.dstToken))) {
            return shiftOut();
        } else if (!isEthereumBased(order.orderInputs.srcToken)) {
            return shiftIn();
        } else {
            return <p>Unsupported token pair.</p>;
        }
    }
);
