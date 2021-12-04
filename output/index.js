class Piece {
    constructor(x, y, isWhite, sourceX, board) {
        this.IsWhite = isWhite;
        this._imgX = sourceX;
        this.X = x;
        this.Y = y;
        this.Width = board.PieceWidth;
        this.Height = board.PieceHeight;
        this.Board = board;
    }
    MoveTo(x, y) {
        this.PrevX = this.X;
        this.PrevY = this.Y;
        this.X = x;
        this.Y = y;
    }
    Draw(ctx) {
        if (this.Board.IsPlayingAsWhite)
            this._draw(ctx, this.X * this.Width, (7 - this.Y) * this.Height);
        else
            this._draw(ctx, (7 - this.X) * this.Width, this.Y * this.Height);
    }
    DrawDraggin(ctx, x, y) {
        this._draw(ctx, x - this.Width / 2, y - this.Height / 2);
    }
    _draw(ctx, x, y) {
        ctx.drawImage(Piece.IMG, this._imgX * Piece.IMG_PIECE_WIDTH, this.IsWhite ? 0 : Piece.IMG_PIECE_HEIGHT, Piece.IMG_PIECE_WIDTH, Piece.IMG_PIECE_HEIGHT, x, y, this.Width, this.Height);
    }
    OnAfterMove() { }
}
Piece.IMG = new Image();
Piece.IMG_PIECE_WIDTH = 0;
Piece.IMG_PIECE_HEIGHT = 0;
Piece.IMG.src = "chessPieces.png";
Piece.IMG.onload = () => {
    Piece.IMG_PIECE_WIDTH = Math.floor(Piece.IMG.width / 6);
    Piece.IMG_PIECE_HEIGHT = Math.floor(Piece.IMG.height / 2);
};
class Bishop extends Piece {
    constructor(x, y, isWhite, board) {
        super(x, y, isWhite, 2, board);
    }
    GetPossibleMoves(pieces) {
        let ret = [];
        let directions = [
            { x: -1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: -1 },
            { x: 1, y: 1 }
        ];
        while (directions.length > 0) {
            for (let i = 0; i < directions.length; i++) {
                if (this.X + directions[i].x < 0 || this.X + directions[i].x > 7 ||
                    this.Y + directions[i].y < 0 || this.Y + directions[i].y > 7) {
                    directions.splice(i, 1);
                    continue;
                }
                if ((this.X + directions[i].x) in pieces[this.Y + directions[i].y]) {
                    if (pieces[this.Y + directions[i].y][this.X + directions[i].x].IsWhite != this.IsWhite)
                        ret.push({ x: this.X + directions[i].x, y: this.Y + directions[i].y });
                    directions.splice(i, 1);
                    continue;
                }
                ret.push({ x: this.X + directions[i].x, y: this.Y + directions[i].y });
                directions[i].x += Math.sign(directions[i].x);
                directions[i].y += Math.sign(directions[i].y);
            }
        }
        return ret;
    }
    Clone() {
        return new Bishop(this.X, this.Y, this.IsWhite, this.Board);
    }
}
class Board {
    constructor(pieceWidth, pieceHeight) {
        this.PieceWidth = pieceWidth;
        this.PieceHeight = pieceHeight;
        this.Init(true);
    }
    Init(isPlayingAsWhite) {
        this.IsWhiteTurn = true;
        this.IsPlayingAsWhite = isPlayingAsWhite;
        this.Pieces = {};
        for (let i = 0; i < 8; i++)
            this.Pieces[i] = {};
        this._pieces = [];
        for (let i = 0; i < 16; i++) {
            let piece;
            let x = i % 8 < 4 ? i % 4 : 7 - i % 4;
            let y = i < 8 ? 0 : 7;
            switch (i % 4) {
                case 0:
                    piece = new Rook(x, y, i < 8, this);
                    break;
                case 1:
                    piece = new Knight(x, y, i < 8, this);
                    break;
                case 2:
                    piece = new Bishop(x, y, i < 8, this);
                    break;
                case 3:
                    piece = (~~(i / 4)) % 2 == 0
                        ? new Queen(x, y, i < 8, this)
                        : new King(x, y, i < 8, this);
                    break;
            }
            this._pieces.push(piece);
            this.Pieces[piece.Y][piece.X] = piece;
            let pawn = new Pawn(i % 8, i < 8 ? 1 : 6, i < 8, this);
            this._pieces.push(pawn);
            this.Pieces[pawn.Y][pawn.X] = pawn;
        }
        this.LastPieceMoved = null;
        this._selectedPiece = null;
        this._possibleMoves = [];
        this._mouseX = 0;
        this._mouseY = 0;
        this.IsCheckmate = false;
        this.IsStalemate = false;
        this.IsWhiteWon = false;
    }
    OnMouseDown(x, y) {
        if (!isInGame)
            return;
        if (this.IsCheckmate || this.IsStalemate)
            return;
        if (this.IsWhiteTurn != this.IsPlayingAsWhite)
            return;
        let pieceX = Math.max(0, Math.min(Math.floor(x / this.PieceWidth), 7));
        let pieceY = Math.max(0, Math.min(Math.floor(y / this.PieceHeight), 7));
        if (this.IsPlayingAsWhite)
            pieceY = 7 - pieceY;
        else
            pieceX = 7 - pieceX;
        if (pieceX in this.Pieces[pieceY]) {
            if (this.Pieces[pieceY][pieceX].IsWhite != this.IsPlayingAsWhite)
                return;
            this._selectedPiece = this.Pieces[pieceY][pieceX];
            let possibleMoves = this._selectedPiece.GetPossibleMoves(this.Pieces);
            this._possibleMoves = this.FilterPossibleMoves(this._selectedPiece, possibleMoves);
        }
        this._mouseX = x;
        this._mouseY = y;
    }
    OnMouseMove(x, y) {
        this._mouseX = x;
        this._mouseY = y;
    }
    OnMouseUp(x, y) {
        if (this._selectedPiece === null)
            return;
        let pieceX = Math.max(0, Math.min(Math.floor(x / this.PieceWidth), 7));
        let pieceY = Math.max(0, Math.min(Math.floor(y / this.PieceHeight), 7));
        if (this.IsPlayingAsWhite)
            pieceY = 7 - pieceY;
        else
            pieceX = 7 - pieceX;
        if (pieceX in this.Pieces[pieceY]) {
            if (this.Pieces[pieceY][pieceX].IsWhite == this._selectedPiece.IsWhite) {
                this._selectedPiece = null;
                return;
            }
        }
        this.Move(this._selectedPiece.X, this._selectedPiece.Y, pieceX, pieceY);
        this._mouseX = 0;
        this._mouseY = 0;
        this._selectedPiece = null;
    }
    Move(x1, y1, x2, y2) {
        if (x1 < 0 || x1 > 7)
            return;
        if (y1 < 0 || y1 > 7)
            return;
        if (x2 < 0 || x2 > 7)
            return;
        if (y2 < 0 || y2 > 7)
            return;
        if (!(x1 in this.Pieces[y1]))
            return;
        if (this.Pieces[y1][x1].IsWhite != this.IsWhiteTurn)
            return;
        if (x2 in this.Pieces[y2] && this.Pieces[y1][x1].IsWhite == this.Pieces[y2][x2].IsWhite)
            return;
        let piece = this.Pieces[y1][x1];
        let possibleMoves = piece.GetPossibleMoves(this.Pieces);
        if (!possibleMoves.some(pos => pos.x == x2 && pos.y == y2))
            return;
        possibleMoves = this.FilterPossibleMoves(piece, possibleMoves);
        if (!possibleMoves.some(pos => pos.x == x2 && pos.y == y2))
            return;
        if (x2 in this.Pieces[y2])
            this._pieces.splice(this._pieces.indexOf(this.Pieces[y2][x2]), 1);
        delete this.Pieces[y1][x1];
        piece.MoveTo(x2, y2);
        this.Pieces[y2][x2] = piece;
        piece.OnAfterMove();
        this.LastPieceMoved = piece;
        this.IsWhiteTurn = !this.IsWhiteTurn;
        let availableMoves = 0;
        let kingX = 0;
        let kingY = 0;
        for (let piece2 of this._pieces) {
            if (piece2.IsWhite != this.IsWhiteTurn)
                continue;
            if (piece2 instanceof King) {
                kingX = piece2.X;
                kingY = piece2.Y;
            }
            let possibleMoves = piece2.GetPossibleMoves(this.Pieces);
            possibleMoves = this.FilterPossibleMoves(piece2, possibleMoves);
            availableMoves += possibleMoves.length;
        }
        if (availableMoves == 0) {
            if (Board.GetPiecesThatCanMoveTo(this.Pieces, !this.IsWhiteTurn, kingX, kingY).length == 0) {
                this.IsStalemate = true;
                this.IsCheckmate = false;
                this.IsWhiteWon = false;
            }
            else {
                this.IsStalemate = false;
                this.IsCheckmate = true;
                this.IsWhiteWon = !this.IsWhiteTurn;
            }
            setTimeout(() => ws.send("search " + myNickname), 2500);
        }
        ws.send(`move ${myNickname} ${opponentNickname} ${x1} ${y1} ${x2} ${y2}`);
    }
    Castle(x, y) {
        if (!(x in this.Pieces[y]))
            return;
        if (!(this.Pieces[y][x] instanceof Rook))
            return;
        let rook = this.Pieces[y][x];
        if (!rook.CanCastle)
            return;
        let newX = x == 0 ? 3 : 5;
        delete this.Pieces[y][x];
        rook.MoveTo(newX, y);
        this.Pieces[y][newX] = rook;
        rook.OnAfterMove();
    }
    EnPassant(x, y) {
        if (!(x in this.Pieces[y]))
            return;
        if (!(this.Pieces[y][x] instanceof Pawn))
            return;
        let pawn = this.Pieces[y][x];
        this._pieces.splice(this._pieces.indexOf(pawn), 1);
        delete this.Pieces[y][x];
    }
    Promotion(x, y) {
        if (!(x in this.Pieces[y]))
            return;
        if (!(this.Pieces[y][x] instanceof Pawn))
            return;
        let pawn = this.Pieces[y][x];
        this._pieces.splice(this._pieces.indexOf(pawn), 1);
        let queen = new Queen(x, y, pawn.IsWhite, this);
        this._pieces.push(queen);
        this.Pieces[y][x] = queen;
    }
    Draw(ctx) {
        for (let iy = 0; iy < 8; iy++) {
            for (let ix = 0; ix < 8; ix++) {
                ctx.fillStyle = (iy + ix) % 2 == 0 ? "white" : "#ccc";
                ctx.fillRect(ix * this.PieceWidth, iy * this.PieceHeight, this.PieceWidth, this.PieceHeight);
            }
        }
        if (this._selectedPiece !== null) {
            for (let pos of this._possibleMoves) {
                ctx.fillStyle = "#446682";
                let top, left;
                if (this.IsPlayingAsWhite) {
                    top = (7 - pos.y) * this.PieceHeight;
                    left = pos.x * this.PieceWidth;
                }
                else {
                    top = pos.y * this.PieceHeight;
                    left = (7 - pos.x) * this.PieceWidth;
                }
                ctx.fillRect(left, top, this.PieceWidth, this.PieceHeight);
            }
        }
        for (let iy = 0; iy < 8; iy++) {
            for (let ix = 0; ix < 8; ix++) {
                ctx.font = "10px Nunito";
                ctx.fillStyle = (iy + ix) % 2 == 1 ? "white" : "#ccc";
                if (this.IsPlayingAsWhite)
                    ctx.fillText(String.fromCharCode(65 + ix) + (8 - iy), ix * this.PieceWidth + 2, (iy + 1) * this.PieceHeight - 2);
                else
                    ctx.fillText(String.fromCharCode(72 - ix) + (iy + 1), ix * this.PieceWidth + 2, (iy + 1) * this.PieceHeight - 2);
            }
        }
        for (let piece of this._pieces)
            if (piece !== this._selectedPiece)
                piece.Draw(ctx);
        if (this._selectedPiece !== null)
            this._selectedPiece.DrawDraggin(ctx, this._mouseX, this._mouseY);
        if (this.IsCheckmate) {
            if (this.IsWhiteWon == this.IsPlayingAsWhite)
                this.DrawGradientScene("green", "YOU WIN!");
            else
                this.DrawGradientScene("red", "YOU LOSE!");
        }
        else if (this.IsStalemate)
            this.DrawGradientScene("gray", "STALEMATE!");
    }
    DrawGradientScene(color, text) {
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
        ctx.font = "48px Nunito";
        ctx.fillStyle = "white";
        let textWidth = ctx.measureText(text).width;
        ctx.fillText(text, canvas.width / 2 - textWidth / 2, 100);
    }
    FilterPossibleMoves(piece, possibleMoves) {
        for (let i = 0; i < possibleMoves.length; i++) {
            let kingX = 0;
            let kingY = 0;
            let boardCopy = {};
            for (let i in this.Pieces) {
                boardCopy[i] = {};
                for (let j in this.Pieces[i]) {
                    if (this.Pieces[i][j] != piece)
                        boardCopy[i][j] = this.Pieces[i][j].Clone();
                    if (boardCopy[i][j] instanceof King && boardCopy[i][j].IsWhite == this.IsWhiteTurn) {
                        kingX = boardCopy[i][j].X;
                        kingY = boardCopy[i][j].Y;
                    }
                }
            }
            let pieceCopy = piece.Clone();
            pieceCopy.MoveTo(possibleMoves[i].x, possibleMoves[i].y);
            boardCopy[possibleMoves[i].y][possibleMoves[i].x] = pieceCopy;
            if (pieceCopy instanceof King && pieceCopy.IsWhite == this.IsWhiteTurn) {
                kingX = pieceCopy.X;
                kingY = pieceCopy.Y;
            }
            let kingAttackers = Board.GetPiecesThatCanMoveTo(boardCopy, !this.IsWhiteTurn, kingX, kingY);
            if (kingAttackers.length > 0) {
                possibleMoves.splice(i, 1);
                i--;
            }
        }
        return possibleMoves;
    }
    static GetCellTypeAt(pieces, x, y) {
        if (x < 0 || x > 7 || y < 0 || y > 7)
            return "outofbounds";
        if (!(x in pieces[y]))
            return "empty";
        return pieces[y][x].IsWhite ? "white" : "black";
    }
    static GetPiecesThatCanMoveTo(pieces, isWhiteTurn, x, y) {
        let ret = [];
        for (let i in pieces) {
            for (let j in pieces[i]) {
                if (pieces[i][j].IsWhite != isWhiteTurn)
                    continue;
                let poses = pieces[i][j].GetPossibleMoves(pieces);
                for (let pos of poses) {
                    if (pos.x == x && pos.y == y) {
                        ret.push(pieces[i][j]);
                        break;
                    }
                }
            }
        }
        return ret;
    }
}
class King extends Piece {
    constructor(x, y, isWhite, board) {
        super(x, y, isWhite, 0, board);
        this.CanCastle = true;
    }
    GetPossibleMoves(pieces) {
        let ret = [];
        for (let ix = -1; ix <= 1; ix++) {
            for (let iy = -1; iy <= 1; iy++) {
                if (ix == 0 && iy == 0)
                    continue;
                if (this.X + ix < 0 || this.X + ix > 7 || this.Y + iy < 0 || this.Y + iy > 7)
                    continue;
                if ((this.X + ix) in pieces[this.Y + iy]) {
                    if (pieces[this.Y + iy][this.X + ix].IsWhite != this.IsWhite)
                        ret.push({ x: this.X + ix, y: this.Y + iy });
                    continue;
                }
                ret.push({ x: this.X + ix, y: this.Y + iy });
            }
        }
        if (this.IsWhite && this.X == 4 && this.Y == 0 && this.CanCastle) {
            if (Board.GetCellTypeAt(pieces, 5, 0) == "empty" &&
                Board.GetCellTypeAt(pieces, 6, 0) == "empty" &&
                Board.GetCellTypeAt(pieces, 7, 0) == "white" &&
                pieces[0][7] instanceof Rook &&
                pieces[0][7].CanCastle &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 4, 0).length == 0 &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 5, 0).length == 0 &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 6, 0).length == 0)
                ret.push({ x: 6, y: 0 });
            if (Board.GetCellTypeAt(pieces, 3, 0) == "empty" &&
                Board.GetCellTypeAt(pieces, 2, 0) == "empty" &&
                Board.GetCellTypeAt(pieces, 1, 0) == "empty" &&
                Board.GetCellTypeAt(pieces, 0, 0) == "white" &&
                pieces[0][0] instanceof Rook &&
                pieces[0][0].CanCastle &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 4, 0).length == 0 &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 3, 0).length == 0 &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 2, 0).length == 0)
                ret.push({ x: 2, y: 0 });
        }
        else if (!this.IsWhite && this.X == 4 && this.Y == 7 && this.CanCastle) {
            if (Board.GetCellTypeAt(pieces, 5, 7) == "empty" &&
                Board.GetCellTypeAt(pieces, 6, 7) == "empty" &&
                Board.GetCellTypeAt(pieces, 7, 7) == "black" &&
                pieces[7][7] instanceof Rook &&
                pieces[7][7].CanCastle)
                ret.push({ x: 6, y: 7 });
            if (Board.GetCellTypeAt(pieces, 3, 7) == "empty" &&
                Board.GetCellTypeAt(pieces, 2, 7) == "empty" &&
                Board.GetCellTypeAt(pieces, 1, 7) == "empty" &&
                Board.GetCellTypeAt(pieces, 0, 7) == "black" &&
                pieces[7][0] instanceof Rook &&
                pieces[7][0].CanCastle)
                ret.push({ x: 2, y: 7 });
        }
        return ret;
    }
    OnAfterMove() {
        if (this.CanCastle) {
            if (this.IsWhite) {
                if (this.PrevX == 4 && this.PrevY == 0) {
                    if (this.X == 6 && this.Y == 0)
                        this.Board.Castle(7, 0);
                    else if (this.X == 2 && this.Y == 0)
                        this.Board.Castle(0, 0);
                }
            }
            else {
                if (this.PrevX == 4 && this.PrevY == 7) {
                    if (this.X == 6 && this.Y == 7)
                        this.Board.Castle(7, 7);
                    else if (this.X == 2 && this.Y == 7)
                        this.Board.Castle(0, 7);
                }
            }
        }
        this.CanCastle = false;
    }
    Clone() {
        let ret = new King(this.X, this.Y, this.IsWhite, this.Board);
        ;
        ret.CanCastle = this.CanCastle;
        return ret;
    }
}
class Knight extends Piece {
    constructor(x, y, isWhite, board) {
        super(x, y, isWhite, 3, board);
    }
    GetPossibleMoves(pieces) {
        let ret = [];
        let possiblePositions = [
            { x: this.X - 2, y: this.Y - 1 },
            { x: this.X - 1, y: this.Y - 2 },
            { x: this.X + 1, y: this.Y - 2 },
            { x: this.X + 2, y: this.Y - 1 },
            { x: this.X + 2, y: this.Y + 1 },
            { x: this.X + 1, y: this.Y + 2 },
            { x: this.X - 1, y: this.Y + 2 },
            { x: this.X - 2, y: this.Y + 1 },
        ];
        for (let pos of possiblePositions) {
            if (pos.x < 0 || pos.x > 7 || pos.y < 0 || pos.y > 7)
                continue;
            if ((pos.x) in pieces[pos.y]) {
                if (pieces[pos.y][pos.x].IsWhite != this.IsWhite)
                    ret.push({ x: pos.x, y: pos.y });
                continue;
            }
            ret.push({ x: pos.x, y: pos.y });
        }
        return ret;
    }
    Clone() {
        return new Knight(this.X, this.Y, this.IsWhite, this.Board);
    }
}
class Pawn extends Piece {
    constructor(x, y, isWhite, board) {
        super(x, y, isWhite, 5, board);
    }
    GetPossibleMoves(pieces) {
        let ret = [];
        if (this.IsWhite && this.Y >= 7)
            return ret;
        else if (!this.IsWhite && this.Y <= 0)
            return ret;
        let canMoveForward = true;
        if (this.IsWhite && this.X in pieces[this.Y + 1])
            canMoveForward = false;
        if (!this.IsWhite && this.X in pieces[this.Y - 1])
            canMoveForward = false;
        if (canMoveForward) {
            ret.push({ x: this.X, y: this.IsWhite ? this.Y + 1 : this.Y - 1 });
            if (this.IsWhite && this.Y == 1 && !(this.X in pieces[3]))
                ret.push({ x: this.X, y: 3 });
            else if (!this.IsWhite && this.Y == 6 && !(this.X in pieces[4]))
                ret.push({ x: this.X, y: 4 });
        }
        if (this.IsWhite) {
            if (Board.GetCellTypeAt(pieces, this.X + 1, this.Y + 1) == "black")
                ret.push({ x: this.X + 1, y: this.Y + 1 });
            if (Board.GetCellTypeAt(pieces, this.X - 1, this.Y + 1) == "black")
                ret.push({ x: this.X - 1, y: this.Y + 1 });
            if (this.Y == 4) {
                if (Board.GetCellTypeAt(pieces, this.X + 1, 4) == "black" &&
                    this.Board.LastPieceMoved == pieces[4][this.X + 1] &&
                    pieces[4][this.X + 1] instanceof Pawn &&
                    pieces[4][this.X + 1].PrevX == pieces[4][this.X + 1].X &&
                    pieces[4][this.X + 1].PrevY == 6)
                    ret.push({ x: this.X + 1, y: this.Y + 1 });
                if (Board.GetCellTypeAt(pieces, this.X - 1, 4) == "black" &&
                    this.Board.LastPieceMoved == pieces[4][this.X - 1] &&
                    pieces[4][this.X - 1] instanceof Pawn &&
                    pieces[4][this.X - 1].PrevX == pieces[4][this.X - 1].X &&
                    pieces[4][this.X - 1].PrevY == 6)
                    ret.push({ x: this.X - 1, y: this.Y + 1 });
            }
        }
        else {
            if (Board.GetCellTypeAt(pieces, this.X + 1, this.Y - 1) == "white")
                ret.push({ x: this.X + 1, y: this.Y - 1 });
            if (Board.GetCellTypeAt(pieces, this.X - 1, this.Y - 1) == "white")
                ret.push({ x: this.X - 1, y: this.Y - 1 });
            if (this.Y == 3) {
                if (Board.GetCellTypeAt(pieces, this.X + 1, 3) == "white" &&
                    this.Board.LastPieceMoved == pieces[3][this.X + 1] &&
                    pieces[3][this.X + 1] instanceof Pawn &&
                    pieces[3][this.X + 1].PrevX == pieces[3][this.X + 1].X &&
                    pieces[3][this.X + 1].PrevY == 1)
                    ret.push({ x: this.X + 1, y: this.Y - 1 });
                if (Board.GetCellTypeAt(pieces, this.X - 1, 3) == "white" &&
                    this.Board.LastPieceMoved == pieces[3][this.X - 1] &&
                    pieces[3][this.X - 1] instanceof Pawn &&
                    pieces[3][this.X - 1].PrevX == pieces[3][this.X - 1].X &&
                    pieces[3][this.X - 1].PrevY == 1)
                    ret.push({ x: this.X - 1, y: this.Y - 1 });
            }
        }
        return ret;
    }
    OnAfterMove() {
        if (this.IsWhite) {
            if (this.Y == 7)
                this.Board.Promotion(this.X, this.Y);
            if (this.Y == 5 && this.PrevY == 4 && this.X != this.PrevX
                && Board.GetCellTypeAt(this.Board.Pieces, this.X, 4) == "black"
                && this.Board.Pieces[4][this.X] instanceof Pawn
                && this.Board.Pieces[4][this.X].PrevX == this.X
                && this.Board.Pieces[4][this.X].PrevY == 6)
                this.Board.EnPassant(this.X, 4);
        }
        else {
            if (this.Y == 0)
                this.Board.Promotion(this.X, this.Y);
            if (this.Y == 2 && this.PrevY == 3 && this.X != this.PrevX
                && Board.GetCellTypeAt(this.Board.Pieces, this.X, 3) == "white"
                && this.Board.Pieces[3][this.X] instanceof Pawn
                && this.Board.Pieces[3][this.X].PrevX == this.X
                && this.Board.Pieces[3][this.X].PrevY == 1)
                this.Board.EnPassant(this.X, 3);
        }
    }
    Clone() {
        return new Pawn(this.X, this.Y, this.IsWhite, this.Board);
    }
}
class Queen extends Piece {
    constructor(x, y, isWhite, board) {
        super(x, y, isWhite, 1, board);
    }
    GetPossibleMoves(pieces) {
        let ret = [];
        let directions = [
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: -1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: -1 },
            { x: 1, y: 1 }
        ];
        while (directions.length > 0) {
            for (let i = 0; i < directions.length; i++) {
                if (this.X + directions[i].x < 0 || this.X + directions[i].x > 7 ||
                    this.Y + directions[i].y < 0 || this.Y + directions[i].y > 7) {
                    directions.splice(i, 1);
                    continue;
                }
                if ((this.X + directions[i].x) in pieces[this.Y + directions[i].y]) {
                    if (pieces[this.Y + directions[i].y][this.X + directions[i].x].IsWhite != this.IsWhite)
                        ret.push({ x: this.X + directions[i].x, y: this.Y + directions[i].y });
                    directions.splice(i, 1);
                    continue;
                }
                ret.push({ x: this.X + directions[i].x, y: this.Y + directions[i].y });
                directions[i].x += Math.sign(directions[i].x);
                directions[i].y += Math.sign(directions[i].y);
            }
        }
        return ret;
    }
    Clone() {
        return new Queen(this.X, this.Y, this.IsWhite, this.Board);
    }
}
class Rook extends Piece {
    constructor(x, y, isWhite, board) {
        super(x, y, isWhite, 4, board);
        this.CanCastle = true;
    }
    GetPossibleMoves(pieces) {
        let ret = [];
        let directions = [
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 0 }
        ];
        while (directions.length > 0) {
            for (let i = 0; i < directions.length; i++) {
                if (this.X + directions[i].x < 0 || this.X + directions[i].x > 7 ||
                    this.Y + directions[i].y < 0 || this.Y + directions[i].y > 7) {
                    directions.splice(i, 1);
                    continue;
                }
                if ((this.X + directions[i].x) in pieces[this.Y + directions[i].y]) {
                    if (pieces[this.Y + directions[i].y][this.X + directions[i].x].IsWhite != this.IsWhite)
                        ret.push({ x: this.X + directions[i].x, y: this.Y + directions[i].y });
                    directions.splice(i, 1);
                    continue;
                }
                ret.push({ x: this.X + directions[i].x, y: this.Y + directions[i].y });
                directions[i].x += Math.sign(directions[i].x);
                directions[i].y += Math.sign(directions[i].y);
            }
        }
        return ret;
    }
    OnAfterMove() {
        this.CanCastle = false;
    }
    Clone() {
        let ret = new Rook(this.X, this.Y, this.IsWhite, this.Board);
        ret.CanCastle = this.CanCastle;
        return ret;
    }
}
var myNickname = "";
var nicknameAskTimeout = -1;
var isLogginedIn = false;
var isInGame = false;
var opponentNickname = "";
var opponentPong = 0;
if (localStorage.getItem('nickname') && localStorage.getItem('nickname').trim().length > 3)
    nicknameInput.value = localStorage.getItem('nickname').trim();
loginBtn.onclick = function () {
    if (nicknameInput.value.trim().length < 3)
        loginError.innerText = "Nickname should be at least 3 symbols long";
    else {
        ws.send("signin " + nicknameInput.value.trim());
        localStorage.setItem('nickname', nicknameInput.value.trim());
        nicknameInput.disabled = true;
        loginBtn.disabled = true;
        nicknameAskTimeout = setTimeout(() => {
            myNickname = nicknameInput.value.trim();
            isLogginedIn = true;
            welcome.style.display = "none";
            chess.style.display = "";
            loginError.innerText = "";
            nicknameInput.disabled = false;
            loginBtn.disabled = false;
            ws.send("search " + myNickname);
        }, 3000);
    }
};
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "#ddd";
ctx.fillRect(0, 0, canvas.width, canvas.height);
const board = new Board(canvas.width / 8, canvas.height / 8);
function gameLoop() {
    board.Draw(ctx);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
canvas.onmousedown = function (ev) {
    let bound = canvas.getBoundingClientRect();
    let x = ev.x - bound.left;
    let y = ev.y - bound.top;
    board.OnMouseDown(x, y);
};
canvas.onmousemove = function (ev) {
    let bound = canvas.getBoundingClientRect();
    let x = ev.x - bound.left;
    let y = ev.y - bound.top;
    board.OnMouseMove(x, y);
};
canvas.onmouseup = function (ev) {
    let bound = canvas.getBoundingClientRect();
    let x = ev.x - bound.left;
    let y = ev.y - bound.top;
    board.OnMouseUp(x, y);
};
const ws = new WebSocket("wss://free3.piesocket.com/v3/1?api_key=87KzZCsi48RAbfXYJRk67qDFRzmuCSLPb7Tv4vk2");
ws.onmessage = function (packet) {
    const message = packet.data;
    const args = message.split(" ");
    switch (args[0]) {
        case "signin":
            if (myNickname == args[1])
                ws.send("signin-conflict " + args[1]);
            break;
        case "signin-conflict":
            if (nicknameInput.value == args[1]) {
                loginError.innerText = args[1] + " already occupied";
                nicknameInput.disabled = false;
                loginBtn.disabled = false;
                if (nicknameAskTimeout >= 0) {
                    clearTimeout(nicknameAskTimeout);
                    nicknameAskTimeout = -1;
                }
            }
            break;
        case "search":
            if (!isLogginedIn)
                break;
            if (isInGame && !board.IsCheckmate && !board.IsStalemate)
                break;
            ws.send("play " + myNickname + " " + args[1]);
            break;
        case "play":
            if (!isLogginedIn)
                break;
            if (isInGame && !board.IsCheckmate && !board.IsStalemate)
                break;
            if (args[2] != myNickname)
                break;
            opponentNickname = args[1];
            isInGame = true;
            board.Init(Math.random() < 0.5);
            ws.send("play-confirm " + (board.IsPlayingAsWhite ? "white" : "black") + " " + myNickname + " " + opponentNickname);
            chessDisplayText.innerText = "Playing against " + opponentNickname;
            opponentPong = performance.now();
            break;
        case "play-confirm":
            if (!isLogginedIn)
                break;
            if (isInGame && !board.IsCheckmate && !board.IsStalemate)
                break;
            if (args[3] != myNickname)
                break;
            opponentNickname = args[2];
            isInGame = true;
            board.Init(args[1] == "black");
            chessDisplayText.innerText = "Playing against " + opponentNickname;
            opponentPong = performance.now();
            break;
        case "move":
            if (!isLogginedIn)
                break;
            if (isInGame && (board.IsCheckmate || board.IsStalemate))
                break;
            if (args[1] != opponentNickname)
                break;
            if (args[2] != myNickname)
                break;
            board.Move(+args[3], +args[4], +args[5], +args[6]);
            break;
        case "ping":
            if (!isLogginedIn)
                break;
            if (isInGame && (board.IsCheckmate || board.IsStalemate))
                break;
            if (args[1] != opponentNickname)
                break;
            if (args[2] != myNickname)
                break;
            ws.send("pong " + myNickname + " " + opponentNickname);
            break;
        case "pong":
            if (!isLogginedIn)
                break;
            if (isInGame && (board.IsCheckmate || board.IsStalemate))
                break;
            if (args[1] != opponentNickname)
                break;
            if (args[2] != myNickname)
                break;
            opponentPong = performance.now();
            break;
    }
};
ws.onclose = ws.onerror = function (err) {
    welcome.style.display = chess.style.display = "none";
    error.style.display = "";
};
setInterval(() => {
    if (!isLogginedIn)
        return;
    if (!isInGame || board.IsCheckmate || board.IsStalemate)
        return;
    if (performance.now() - opponentPong < 30000)
        ws.send("ping " + myNickname + " " + opponentNickname);
    else {
        isInGame = false;
        chessDisplayText.innerText = `${opponentNickname} left, looking for opponent`;
        ws.send("search " + myNickname);
    }
}, 10000);
