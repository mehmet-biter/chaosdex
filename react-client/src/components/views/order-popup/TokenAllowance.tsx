import * as React from "react";

import { Loading } from "@renproject/react-components";

import { _catchInteractionErr_ } from "../../../lib/errors";
import { Token } from "../../../state/generalTypes";
import { Commitment } from "../../../state/persistentContainer";
import { Popup } from "../Popup";

export const TokenAllowance: React.StatelessComponent<{
    token: Token,
    amount: string,
    commitment: Commitment | null,
    orderID: string;
    submit: (orderID: string) => Promise<void>,
    hide?: () => void,
}> = ({ token, amount, commitment, orderID, submit, hide }) => {
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null as Error | null);

    const onSubmit = () => {
        setError(null);
        setSubmitting(true);
        submit(orderID).catch((error) => {
            setSubmitting(false);
            setError(error);
            _catchInteractionErr_(error);
        });
    };
    return <Popup cancel={hide}>
        <div className="address-input">
            <div className="popup--body">
                <h2>Transfer Approval</h2>
                <div className="address-input--message">
                    Please approve the transfer of {amount} {token.toUpperCase()}.
                    <br />
                    <br />
                </div>
                {error ? <span className="red">{`${error.message || error}`}</span> : null}
                <div className="popup--buttons">
                    <button className="button open--confirm" disabled={submitting || commitment === null} onClick={onSubmit}>{submitting ? <Loading alt={true} /> : "Approve"}</button>
                </div>
            </div>
        </div>
    </Popup>;
};
