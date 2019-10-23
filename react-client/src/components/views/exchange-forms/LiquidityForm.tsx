import * as React from "react";

import { Loading } from "@renproject/react-components";

import { _catchBackgroundErr_ } from "../../../lib/errors";
import { getMarket } from "../../../lib/market";
import { connect, ConnectedProps } from "../../../state/connect";
import { UIContainer } from "../../../state/uiContainer";
import { LiquidityFormInputs } from "./LiquidityFormInputs";

interface Props {
    handleLogin: () => void;
}

export const LiquidityForm = connect<Props & ConnectedProps<[UIContainer]>>([UIContainer])(
    ({ handleLogin, containers: [uiContainer] }) => {

        const openOrder = async () => {
            uiContainer.setSubmitting(true).catch(_catchBackgroundErr_);
        };

        const orderInput = uiContainer.state.orderInputs;
        const market = getMarket(orderInput.srcToken, orderInput.dstToken);

        const marketPrice = 0;

        const loggedIn = uiContainer.state.address !== null;
        const sufficientBalance = uiContainer.sufficientBalance();
        const validVolume = uiContainer.validVolume();
        const disabled = !loggedIn || !sufficientBalance || !validVolume;

        let button;
        if (!market) {
            button = <button disabled={true} className="button submit-swap">
                Token pair not supported
            </button>;
        } else if (!loggedIn) {
            button = <button
                onClick={handleLogin}
                className="button button--white submit-swap connect-button"
            >
                Connect to trade
            </button>;
        } else {
            button = <button
                disabled={disabled}
                onClick={openOrder}
                className="button submit-swap"
            >
                {uiContainer.state.submitting ? <Loading alt={true} /> :
                    !loggedIn ? "Connect to trade" :
                        !sufficientBalance ? "Insufficient balance" :
                            !validVolume ? "Volume too low" :
                                "Trade"
                }
            </button>;
        }

        return <div className="section order">
            <LiquidityFormInputs marketPrice={marketPrice} />
            <div className="submit-swap-buttons">{button}</div>
        </div>;
    }
);
