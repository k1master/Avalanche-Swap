//SPDX-License-Identifier: mit
pragma solidity >=0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wrapper {

    ERC20 private inToken;

    constructor(address _inToken) {
        inToken = ERC20(_inToken);
    }
    /**
     * Convert an amount of input token_ to an equivalent amount of the output token
     *
     * @param token_ address of token to swap
     * @param amount amount of token to swap/receive
     */
    function swap(address token_, uint amount) external {
        require(ERC20(token_).transferFrom(msg.sender, address(this), amount));
        require(inToken.transfer(msg.sender, amount));
    }

    /**
     * Convert an amount of the output token to an equivalent amount of input token_
     *
     * @param token_ address of token to receive
     * @param amount amount of token to swap/receive
     */
    function unswap(address token_, uint amount) external {
        require(inToken.transferFrom(msg.sender, address(this), amount));
        require(ERC20(token_).transfer(msg.sender, amount));
    }
}
